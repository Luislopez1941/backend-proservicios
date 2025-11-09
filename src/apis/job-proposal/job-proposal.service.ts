import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { NotificationService } from '../notification/notification.service';
import { CreateJobProposalDto } from './dto/create-job-proposal.dto';
import { UpdateJobProposalDto } from './dto/update-job-proposal.dto';

@Injectable()
export class JobProposalService {
  constructor(
    private prisma: PrismaService,
    private supabaseStorage: SupabaseStorageService,
    private notificationService: NotificationService
  ) {}

  async create(createJobProposalDto: CreateJobProposalDto) {
    try {
      console.log('🔍 DEBUG: Creando job proposal con datos:', createJobProposalDto);
      
      // Verificar que ambos usuarios existen
      const [issuer, receiver] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: createJobProposalDto.issuer_id } }),
        this.prisma.user.findUnique({ where: { id: createJobProposalDto.receiver_id } })
      ]);
      
      console.log('🔍 DEBUG: Issuer encontrado:', issuer?.first_name, issuer?.first_surname);
      console.log('🔍 DEBUG: Receiver encontrado:', receiver?.first_name, receiver?.first_surname);

      if (!issuer || !receiver) {
        return {
          status: 'error',
          message: 'Uno o ambos usuarios no existen',
          data: null
        };
      }

      // Buscar chat existente entre estos dos usuarios
      console.log('🔍 DEBUG: Buscando chat existente entre usuarios:', createJobProposalDto.issuer_id, 'y', createJobProposalDto.receiver_id);
      
      let chat = await this.prisma.chat.findFirst({
        where: {
          AND: [
            {
              OR: [
                { issuer_id: createJobProposalDto.issuer_id, receiver_id: createJobProposalDto.receiver_id },
                { issuer_id: createJobProposalDto.receiver_id, receiver_id: createJobProposalDto.issuer_id }
              ]
            }
          ]
        }
      });

      console.log('🔍 DEBUG: Chat encontrado:', chat?.id);

      // Si no existe el chat, crearlo
      if (!chat) {
        console.log('🔍 DEBUG: Creando nuevo chat');
        chat = await this.prisma.chat.create({
          data: {
            issuer_id: createJobProposalDto.issuer_id,
            receiver_id: createJobProposalDto.receiver_id,
            chat_type: 'private',
            message_text: {}
          }
        });
        console.log('🔍 DEBUG: Chat creado con ID:', chat.id);
      }

      // Crear el mensaje en el chat
      console.log('🔍 DEBUG: Creando mensaje en chat ID:', chat.id);
      
      const message = await this.prisma.message.create({
        data: {
          issuer_id: createJobProposalDto.issuer_id,
          receiver_id: createJobProposalDto.receiver_id,
          chat_id: chat.id,
          message: createJobProposalDto.description || 'Propuesta de trabajo',
          type_message: 'proposal',
          message_status: 'sent',
          last_message_sender: createJobProposalDto.issuer_id.toString(),
          unread_count: 1,
          is_online: true
        }
      });

      console.log('🔍 DEBUG: Mensaje creado con ID:', message.id);

      // Ahora crear la propuesta con el message_id correcto
      console.log('🔍 DEBUG: Creando job proposal con message_id:', message.id);
      
      const jobProposal = await this.prisma.jobProposal.create({
        data: {
          message_id: message.id,
          user_id: createJobProposalDto.user_id,
          issuer_id: createJobProposalDto.issuer_id,
          receiver_id: createJobProposalDto.receiver_id,
          title: createJobProposalDto.title,
          description: createJobProposalDto.description,
          images: {}, // Inicialmente vacío
          status: createJobProposalDto.status || 'active',
          price_total: createJobProposalDto.price_total,
          currency: createJobProposalDto.currency,
          accepts_payment_methods: createJobProposalDto.accepts_payment_methods
        },
        include: {
          message: {
            include: {
              issuer: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              },
              receiver: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
              type_user: true
            }
          }
        }
      });

      // Procesar imágenes si están presentes
      let imageUrls: string[] = [];
      if (createJobProposalDto.images && Array.isArray(createJobProposalDto.images)) {
        try {
          imageUrls = await this.supabaseStorage.uploadProposalImages(
            createJobProposalDto.images,
            jobProposal.id
          );

          // Actualizar la propuesta con las URLs de las imágenes
          const updatedProposal = await this.prisma.jobProposal.update({
            where: { id: jobProposal.id },
            data: { images: imageUrls },
            include: {
              message: {
                include: {
                  issuer: {
                    select: {
                      id: true,
                      first_name: true,
                      first_surname: true,
                      email: true,
                      profilePhoto: true,
                      type_user: true
                    }
                  },
                  receiver: {
                    select: {
                      id: true,
                      first_name: true,
                      first_surname: true,
                      email: true,
                      profilePhoto: true,
                      type_user: true
                    }
                  }
                }
              },
              user: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              }
            }
          });

          // Crear notificación para el usuario receptor
          try {
            console.log('🔔 Creando notificación para el receptor de la propuesta...');
            await this.notificationService.create({
              user_id: createJobProposalDto.receiver_id, // El que recibe la propuesta
              from_user_id: createJobProposalDto.issuer_id, // El que envía la propuesta
              type: 'proposal_received',
              title: 'Nueva propuesta recibida',
              message: `Has recibido una nueva propuesta: ${createJobProposalDto.title}`,
              is_read: false,
              proposal_id: updatedProposal.id, // Relacionar con la propuesta
              metadata: {
                proposal_id: updatedProposal.id,
                message_id: message.id,
                chat_id: chat.id,
                issuer_id: createJobProposalDto.issuer_id,
                receiver_id: createJobProposalDto.receiver_id
              }
            });
            console.log('✅ Notificación creada para el receptor');
          } catch (notificationError) {
            console.error('⚠️ Error al crear notificación:', notificationError);
            // No fallar el proceso si la notificación falla
          }

          return {
            status: 'success',
            message: 'Propuesta de trabajo creada exitosamente',
            data: updatedProposal
          };
        } catch (imageError) {
          console.error('Error al procesar imágenes:', imageError);
          // Si hay error con las imágenes, eliminar la propuesta creada
          try {
            await this.prisma.jobProposal.delete({ where: { id: jobProposal.id } });
          } catch (deleteError) {
            console.error('Error al eliminar propuesta:', deleteError);
          }
          
          return {
            status: 'error',
            message: `Error al procesar las imágenes: ${imageError.message}`,
            data: null
          };
        }
      }

      console.log('🔍 DEBUG: Job proposal creada exitosamente con ID:', jobProposal.id);
      
      // Crear notificación para el usuario receptor
      try {
        console.log('🔔 Creando notificación para el receptor de la propuesta...');
        await this.notificationService.create({
          user_id: createJobProposalDto.receiver_id, // El que recibe la propuesta
          from_user_id: createJobProposalDto.issuer_id, // El que envía la propuesta
          type: 'proposal_received',
          title: 'Nueva propuesta recibida',
          message: `Has recibido una nueva propuesta: ${createJobProposalDto.title}`,
          is_read: false,
          proposal_id: jobProposal.id, // Relacionar con la propuesta
          metadata: {
            proposal_id: jobProposal.id,
            message_id: message.id,
            chat_id: chat.id,
            issuer_id: createJobProposalDto.issuer_id,
            receiver_id: createJobProposalDto.receiver_id
          }
        });
        console.log('✅ Notificación creada para el receptor');
      } catch (notificationError) {
        console.error('⚠️ Error al crear notificación:', notificationError);
        // No fallar el proceso si la notificación falla
      }

      console.log('🔍 DEBUG: ✅ PROCESO COMPLETADO');

      return {
        status: 'success',
        message: 'Propuesta de trabajo creada exitosamente',
        data: jobProposal
      };
    } catch (error) {
      console.error('Error creating job proposal:', error);
      return {
        status: 'error',
        message: 'Error al crear la propuesta de trabajo',
        data: null
      };
    }
  }

  async updateProposalStatus(proposalId: number, status: string, rating?: number, raterId?: number, ratedUserId?: number) {
    try {
      console.log('🔍 DEBUG: Actualizando status de propuesta:', proposalId, 'a:', status);
      
      // Si el status es 'accepted' o 'accept', relacionar la propuesta con el receiver
      if(status === 'accepted' || status === 'accept') {
        console.log('🔍 DEBUG: Procesando aceptación de propuesta');
        
        // Obtener la propuesta para identificar al receiver
        const proposal = await this.prisma.jobProposal.findUnique({
          where: { id: proposalId },
          select: {
            id: true,
            receiver_id: true,
            user_id: true,
            issuer_id: true,
            title: true
          }
        });

        if (!proposal) {
          return {
            status: 'error',
            message: 'Propuesta no encontrada',
            data: null
          };
        }

        console.log('🔍 DEBUG: Propuesta encontrada - Receiver ID:', proposal.receiver_id);
        console.log('🔍 DEBUG: User ID actual:', proposal.user_id);
        console.log('🔍 DEBUG: Issuer ID:', proposal.issuer_id);

        // Actualizar la propuesta para relacionarla con el receiver
        const updatedProposal = await this.prisma.jobProposal.update({
          where: { id: proposalId },
          data: {
            user_id: proposal.receiver_id, // Relacionar con el receiver
            status: 'accepted' as any,
            updated_at: new Date()
          },
          include: {
            message: {
              include: {
                issuer: {
                  select: {
                    id: true,
                    first_name: true,
                    first_surname: true,
                    email: true,
                    profilePhoto: true,
                    type_user: true
                  }
                },
                receiver: {
                  select: {
                    id: true,
                    first_name: true,
                    first_surname: true,
                    email: true,
                    profilePhoto: true,
                    type_user: true
                  }
                }
              }
            },
            user: {
              select: {
                id: true,
                first_name: true,
                first_surname: true,
                email: true,
                profilePhoto: true,
                type_user: true
              }
            }
          }
        });

        console.log('🔍 DEBUG: ✅ Propuesta aceptada y relacionada con receiver ID:', proposal.receiver_id);

        return {
          status: 'success',
          message: 'Propuesta aceptada exitosamente',
          data: updatedProposal
        };
      }

      if(status === 'confirmed_payment') {
        // Obtener la propuesta con los IDs de los usuarios
        const proposal = await this.prisma.jobProposal.findUnique({
          where: { id: proposalId },
          select: {
            issuer_id: true,
            receiver_id: true
          }
        });

        if (proposal) {
          // Actualizar paid_jobs del issuer (quien emitió la propuesta)
          await this.prisma.user.update({
            where: { id: proposal.issuer_id },
            data: {
              paid_jobs: {
                increment: 1
              }
            }
          });

          // Actualizar finished_works del receiver (quien recibió la propuesta)
          await this.prisma.user.update({
            where: { id: proposal.receiver_id },
            data: {
              finished_works: {
                increment: 1
              }
            }
          });
        }
      }

      if(status === 'rating_status' && rating && raterId && ratedUserId) {
        console.log(`🔄 Procesando rating_status para propuesta ${proposalId} con rating ${rating}, raterId ${raterId}, ratedUserId ${ratedUserId}`);
        
        // Obtener la propuesta para determinar quién es el cliente y quién el trabajador
        const proposal = await this.prisma.jobProposal.findUnique({
          where: { id: proposalId },
          select: { issuer_id: true, receiver_id: true }
        });

        if (!proposal) {
          throw new Error(`Propuesta ${proposalId} no encontrada`);
        }

        // Determinar si el raterId es el cliente (issuer) o el trabajador (receiver)
        const isRaterClient = raterId === proposal.issuer_id;
        const isRaterWorker = raterId === proposal.receiver_id;

        if (!isRaterClient && !isRaterWorker) {
          throw new Error(`El usuario ${raterId} no está autorizado para calificar esta propuesta`);
        }

        console.log(`👤 RaterId ${raterId} es ${isRaterClient ? 'CLIENTE (issuer)' : 'TRABAJADOR (receiver)'}`);
        
        // Verificar si ya existe una reseña para esta propuesta
        const existingReview = await this.prisma.review.findFirst({
          where: {
            user_id: raterId,
            job_id: proposalId
          }
        });

        let review;
        if (existingReview) {
          // Actualizar la reseña existente
          review = await this.prisma.review.update({
            where: { id: existingReview.id },
            data: {
              comment: `Calificación actualizada del trabajo`
            }
          });
          console.log(`📝 Reseña actualizada - ID: ${review.id}`);
        } else {
          // Crear una nueva reseña
          review = await this.prisma.review.create({
            data: {
              user_id: raterId,      // Quien está calificando
              user_review_id: ratedUserId,  // Usuario siendo calificado
              job_id: proposalId,
              comment: `Calificación automática del trabajo`
            }
          });
          console.log(`📝 Nueva reseña creada - ID: ${review.id}`);
        }

        // Obtener el usuario actual para calcular el nuevo promedio
        const currentUser = await this.prisma.user.findUnique({
          where: { id: ratedUserId },
          select: { rating: true, reviewsCount: true }
        });

        if (!currentUser) {
          throw new Error(`Usuario ${ratedUserId} no encontrado`);
        }

        console.log(`📊 Usuario actual - Rating: ${currentUser.rating}, Reseñas: ${currentUser.reviewsCount}`);

        // Calcular el nuevo promedio usando el rating actual del usuario
        const currentTotal = currentUser.rating * currentUser.reviewsCount;
        const newTotal = currentTotal + rating;
        const newReviewsCount = currentUser.reviewsCount + 1;
        const newAverageRating = newTotal / newReviewsCount;
        const roundedRating = Math.round(newAverageRating * 10) / 10; // Redondear a 1 decimal

        console.log(`📊 Cálculo: (${currentUser.rating} × ${currentUser.reviewsCount}) + ${rating} = ${newTotal} / ${newReviewsCount} = ${newAverageRating} → Redondeado: ${roundedRating}`);

        // Actualizar el rating promedio del usuario que recibe la calificación
        const updatedUser = await this.prisma.user.update({
          where: { id: ratedUserId },
          data: {
            rating: roundedRating,
            reviewsCount: newReviewsCount
          },
          select: {
            id: true,
            first_name: true,
            rating: true,
            reviewsCount: true
          }
        });
        console.log(`✅ Usuario actualizado - ID: ${updatedUser.id}, Rating promedio: ${updatedUser.rating}, Total reseñas: ${updatedUser.reviewsCount}`);

        // Actualizar el rating_status correspondiente según si es cliente o trabajador
        if (isRaterClient) {
          await this.prisma.$executeRaw`
            UPDATE "JobProposal" 
            SET rating_status_reviwer = true, rating_reviewer = ${rating}
            WHERE id = ${proposalId}
          `;
          console.log(`✅ Rating status del CLIENTE actualizado para propuesta ${proposalId} con rating ${rating}`);
        } else if (isRaterWorker) {
          await this.prisma.$executeRaw`
            UPDATE "JobProposal" 
            SET rating_status_receiver = true, rating_receiver = ${rating}
            WHERE id = ${proposalId}
          `;
          console.log(`✅ Rating status del TRABAJADOR actualizado para propuesta ${proposalId} con rating ${rating}`);
        }
        
        // Verificar que se actualizó correctamente
        const updatedProposal = await this.prisma.jobProposal.findUnique({
          where: { id: proposalId },
          select: {
            id: true,
            rating_status_reviwer: true,
            rating_status_receiver: true,
            rating_reviewer: true,
            rating_receiver: true
          } as any
        });
        
        if (updatedProposal) {
          console.log(`✅ Propuesta actualizada - ID: ${updatedProposal.id}, Rating Status Cliente: ${updatedProposal.rating_status_reviwer}, Rating Status Trabajador: ${updatedProposal.rating_status_receiver}`);
          console.log(`📊 Ratings - Cliente: ${updatedProposal.rating_reviewer}, Trabajador: ${updatedProposal.rating_receiver}`);
          console.log(`🎯 RESUMEN: Usuario ${ratedUserId} ahora tiene rating ${updatedUser.rating}, Propuesta ${proposalId} tiene rating del ${isRaterClient ? 'CLIENTE' : 'TRABAJADOR'}: ${rating}`);
        } else {
          console.log(`❌ Error: No se pudo encontrar la propuesta ${proposalId} después de la actualización`);
        }
      }

      // Solo actualizar el status si NO es rating_status
      let updateData: any = {
        updated_at: new Date()
      };

      if (status !== 'rating_status') {
        updateData.status = status as any; // Cast to ProposalStatus enum
      }

      const updatedProposal = await this.prisma.jobProposal.update({
        where: { id: proposalId },
        data: updateData,
        include: {
          message: {
            include: {
              issuer: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              },
              receiver: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
              type_user: true
            }
          }
        }
      });

      console.log(`✅ Propuesta ${proposalId} actualizada exitosamente a estado: ${status}`);
      return {
        status: 'success',
        message: `Propuesta actualizada a estado: ${status}`,
        data: updatedProposal
      };
    } catch (error) {
        console.error(`❌ Error al actualizar propuesta ${proposalId} a ${status}:`, error);
      return {
        status: 'error',
        message: `Error al actualizar propuesta a ${status}`,
        data: null
      };
    }
  }

  

  async getUserProposals(userId: number) {
    try {
      const proposals = await this.prisma.jobProposal.findMany({
        where: {
          OR: [
            { receiver_id: userId },
            { issuer_id: userId }
          ]
        },
        select: {
          id: true,
          message_id: true,
          user_id: true,
          issuer_id: true,
          receiver_id: true,
          title: true,
          description: true,
          images: true,
          status: true,
          created_at: true,
          updated_at: true,
          rating_status_reviwer: true,
          rating_status_receiver: true,
          review_status_reviewer: true,
          review_status_receiver: true,
          rating_reviewer: true,  // Calificación del cliente
          rating_receiver: true,  // Calificación del trabajador
          price_total: true,
          currency: true,
          accepts_payment_methods: true,
          message: {
            include: {
              issuer: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              },
              receiver: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
              type_user: true
            }
          }
        } as any,
        orderBy: { created_at: 'desc' }
      });

      return {
        status: 'success',
        message: `Se encontraron ${proposals.length} propuestas`,
        data: proposals
      };
    } catch (error) {
        console.error('Error al obtener propuestas:', error);
      return {
        status: 'error',
        message: 'Error al obtener propuestas',
        data: null
      };
    }
  }

  async getProposalsByConfirmedPayment(userId: number) {
    try {
      const proposals = await this.prisma.jobProposal.findMany({
        where: {
          AND: [
            { status: 'confirmed_payment' },
            {
              OR: [
                { receiver_id: userId },
                { issuer_id: userId }
              ]
            }
          ]
        },
        select: {
          id: true,
          message_id: true,
          user_id: true,
          issuer_id: true,
          receiver_id: true,
          title: true,
          description: true,
          images: true,
          status: true,
          created_at: true,
          updated_at: true,
          rating_status_reviwer: true,
          rating_status_receiver: true,
          review_status_reviewer: true,
          review_status_receiver: true,
          rating_reviewer: true,
          rating_receiver: true,
          price_total: true,
          currency: true,
          accepts_payment_methods: true,
          message: {
            include: {
              issuer: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              },
              receiver: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
              type_user: true
            }
          }
        } as any,
        orderBy: { created_at: 'desc' }
      });

      return {
        status: 'success',
        message: `Se encontraron ${proposals.length} propuestas con pago confirmado`,
        data: proposals
      };
    } catch (error) {
      console.error('Error al obtener propuestas con pago confirmado:', error);
      return {
        status: 'error',
        message: 'Error al obtener propuestas con pago confirmado',
        data: null
      };
    }
  }

  async getAllProposalsDebug() {
    try {
      const allProposals = await this.prisma.jobProposal.findMany({
        select: {
          id: true,
          title: true,
          issuer_id: true,
          receiver_id: true,
          user_id: true,
          status: true,
          created_at: true,
          message_id: true
        },
        orderBy: { created_at: 'desc' }
      });

      return {
        status: 'success',
        message: `Total de propuestas en BD: ${allProposals.length}`,
        data: allProposals
      };
    } catch (error) {
      console.error('Error en getAllProposalsDebug:', error);
      return {
        status: 'error',
        message: 'Error al obtener propuestas de debug',
        data: null
      };
    }
  }

  async findAll() {
    try {
      const proposals = await this.prisma.jobProposal.findMany({
        include: {
          message: {
            include: {
              issuer: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              },
              receiver: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
              type_user: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      return {
        status: 'success',
        message: `Se encontraron ${proposals.length} propuestas`,
        data: proposals
      };
    } catch (error) {
      console.error('Error getting all proposals:', error);
      return {
        status: 'error',
        message: 'Error al obtener propuestas',
        data: null
      };
    }
  }

  async findOne(id: number) {
    try {
      const proposal = await this.prisma.jobProposal.findUnique({
        where: { id },
        include: {
          message: {
            include: {
              issuer: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              },
              receiver: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
              type_user: true
            }
          }
        }
      });

      if (!proposal) {
        return {
          status: 'error',
          message: 'Propuesta no encontrada',
          data: null
        };
      }

      return {
        status: 'success',
        message: 'Propuesta obtenida exitosamente',
        data: proposal
      };
    } catch (error) {
      console.error('Error getting proposal:', error);
      return {
        status: 'error',
        message: 'Error al obtener la propuesta',
        data: null
      };
    }
  }

  async update(id: number, updateJobProposalDto: UpdateJobProposalDto) {
    try {
      // Obtener la propuesta actual para verificar las imágenes existentes
      const currentProposal = await this.prisma.jobProposal.findUnique({
        where: { id },
        select: { images: true }
      });

      if (!currentProposal) {
        return {
          status: 'error',
          message: 'Propuesta no encontrada',
          data: null
        };
      }

      // Preparar datos de actualización
      const updateData: any = {
        ...updateJobProposalDto,
        updated_at: new Date()
      };

      // Procesar imágenes si están presentes en la actualización
      if (updateJobProposalDto.images && Array.isArray(updateJobProposalDto.images)) {
        try {
          // Eliminar imágenes anteriores si existen
          if (currentProposal.images && Array.isArray(currentProposal.images)) {
            await this.supabaseStorage.deleteProposalImages(currentProposal.images as string[]);
          }

          // Subir nuevas imágenes
          const imageUrls = await this.supabaseStorage.uploadProposalImages(
            updateJobProposalDto.images,
            id
          );
          
          updateData.images = imageUrls;
        } catch (imageError) {
          console.error('Error al actualizar imágenes:', imageError);
          return {
            status: 'error',
            message: `Error al actualizar las imágenes: ${imageError.message}`,
            data: null
          };
        }
      }

      const updatedProposal = await this.prisma.jobProposal.update({
        where: { id },
        data: updateData,
        include: {
          message: {
            include: {
              issuer: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              },
              receiver: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
              type_user: true
            }
          }
        }
      });

      return {
        status: 'success',
        message: 'Propuesta actualizada exitosamente',
        data: updatedProposal
      };
    } catch (error) {
      console.error('Error updating proposal:', error);
      return {
        status: 'error',
        message: 'Error al actualizar la propuesta',
        data: null
      };
    }
  }

  async uploadImages(id: number, images: string[]) {
    try {
      // Verificar que la propuesta existe
      const proposal = await this.prisma.jobProposal.findUnique({
        where: { id },
        select: { id: true, images: true }
      });

      if (!proposal) {
        return {
          status: 'error',
          message: 'Propuesta no encontrada',
          data: null
        };
      }

      // Eliminar imágenes anteriores si existen
      if (proposal.images && Array.isArray(proposal.images)) {
        await this.supabaseStorage.deleteProposalImages(proposal.images as string[]);
      }

      // Subir nuevas imágenes
      const imageUrls = await this.supabaseStorage.uploadProposalImages(images, id);

      // Actualizar la propuesta con las nuevas URLs
      const updatedProposal = await this.prisma.jobProposal.update({
        where: { id },
        data: { images: imageUrls },
        include: {
          message: {
            include: {
              issuer: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              },
              receiver: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
              type_user: true
            }
          }
        }
      });

      return {
        status: 'success',
        message: 'Imágenes subidas exitosamente',
        data: updatedProposal
      };
    } catch (error) {
      console.error('Error uploading images:', error);
      return {
        status: 'error',
        message: `Error al subir imágenes: ${error.message}`,
        data: null
      };
    }
  }

  async remove(id: number) {
    try {
      // Obtener la propuesta para eliminar las imágenes asociadas
      const proposal = await this.prisma.jobProposal.findUnique({
        where: { id },
        select: { images: true }
      });

      if (!proposal) {
        return {
          status: 'error',
          message: 'Propuesta no encontrada',
          data: null
        };
      }

      // Eliminar imágenes de Supabase Storage si existen
      if (proposal.images && Array.isArray(proposal.images)) {
        try {
          await this.supabaseStorage.deleteProposalImages(proposal.images as string[]);
        } catch (imageError) {
          console.error('Error al eliminar imágenes de Supabase:', imageError);
          // Continuar con la eliminación de la propuesta aunque falle la eliminación de imágenes
        }
      }

      // Eliminar la propuesta de la base de datos
      await this.prisma.jobProposal.delete({
        where: { id }
      });

      return {
        status: 'success',
        message: 'Propuesta eliminada exitosamente',
        data: null
      };
    } catch (error) {
      console.error('Error deleting proposal:', error);
      return {
        status: 'error',
        message: 'Error al eliminar la propuesta',
        data: null
      };
    }
  }

  async updateReviewStatus(proposalId: number) {
    try {
      // Verificar que la propuesta existe
      const proposal = await this.prisma.jobProposal.findUnique({
        where: { id: proposalId }
      });

      if (!proposal) {
        return {
          status: 'error',
          message: 'Propuesta no encontrada',
          data: null
        };
      }

      // Actualizar solo el review_status a true
      const updatedProposal = await this.prisma.jobProposal.update({
        where: { id: proposalId },
        data: {
          review_status_reviewer: true,
          review_status_receiver: true,
          updated_at: new Date()
        },
        include: {
          message: {
            include: {
              issuer: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              },
              receiver: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  email: true,
                  profilePhoto: true,
                  type_user: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
              type_user: true
            }
          }
        }
      });

      return {
        status: 'success',
        message: 'Review status actualizado exitosamente',
        data: updatedProposal
      };
    } catch (error) {
      console.error('Error updating review status:', error);
      return {
        status: 'error',
        message: 'Error al actualizar el review status',
        data: null
      };
    }
  }
}
