import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { CreateJobProposalDto } from './dto/create-job-proposal.dto';
import { UpdateJobProposalDto } from './dto/update-job-proposal.dto';

@Injectable()
export class JobProposalService {
  constructor(
    private prisma: PrismaService,
    private supabaseStorage: SupabaseStorageService
  ) {}

  async create(createJobProposalDto: CreateJobProposalDto) {
    try {
      // Verificar que ambos usuarios existen
      const [issuer, receiver] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: createJobProposalDto.issuer_id } }),
        this.prisma.user.findUnique({ where: { id: createJobProposalDto.receiver_id } })
      ]);

      if (!issuer || !receiver) {
        return {
          status: 'error',
          message: 'Uno o ambos usuarios no existen',
          data: null
        };
      }

      // Buscar chat existente entre estos dos usuarios
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

      // Si no existe el chat, crearlo
      if (!chat) {
        chat = await this.prisma.chat.create({
          data: {
            issuer_id: createJobProposalDto.issuer_id,
            receiver_id: createJobProposalDto.receiver_id,
            chat_type: 'private',
            message_text: {}
          }
        });
      }

      // Crear el mensaje en el chat
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

      // Ahora crear la propuesta con el message_id correcto
      const jobProposal = await this.prisma.jobProposal.create({
        data: {
          message_id: message.id,
          user_id: createJobProposalDto.user_id,
          issuer_id: createJobProposalDto.issuer_id,
          receiver_id: createJobProposalDto.receiver_id,
          title: createJobProposalDto.title,
          description: createJobProposalDto.description,
          images: {}, // Inicialmente vacío
          status: createJobProposalDto.status || 'active'
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

  async updateProposalStatus(proposalId: number, status: string, rating?: number) {
    try {
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

      if(status === 'rating_status' && rating) {
        // Obtener la propuesta con el receiver_id
        const proposal = await this.prisma.jobProposal.findUnique({
          where: { id: proposalId },
          select: {
            receiver_id: true
          }
        });

        if (proposal) {
          // Actualizar el rating del usuario receiver
          await this.prisma.user.update({
            where: { id: proposal.receiver_id },
            data: {
              rating: rating
            }
          });

          // Actualizar el rating_status de la propuesta
          await this.prisma.jobProposal.update({
            where: { id: proposalId },
            data: {
              rating_status: true
            }
          });
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

      return {
        status: 'success',
        message: `Propuesta actualizada a estado: ${status}`,
        data: updatedProposal
      };
    } catch (error) {
        console.error(`Error al actualizar propuesta a ${status}:`, error);
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
        console.error('Error al obtener propuestas:', error);
      return {
        status: 'error',
        message: 'Error al obtener propuestas',
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
          review_status: true,
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
