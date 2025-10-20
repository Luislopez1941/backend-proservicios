import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { UpdateMessageStatusDto } from './dto/update-message-status.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) { }

  async create(createMessageDto: CreateMessageDto) {
    try {
      // Verificar que el chat existe
      const chat = await this.prisma.chat.findUnique({
        where: { id: createMessageDto.chat_id }
      });

      if (!chat) {
        return {
          status: 'warning',
          message: 'El chat no existe'
        };
      }

      // Verificar que los usuarios existen
      const [issuer, receiver] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: createMessageDto.issuer_id } }),
        this.prisma.user.findUnique({ where: { id: createMessageDto.receiver_id } })
      ]);

      if (!issuer || !receiver) {
        return {
          status: 'warning',
          message: 'Uno o ambos usuarios no existen'
        };
      }

      const message = await this.prisma.message.create({
        data: createMessageDto,
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
          },
          chat: {
            select: {
              id: true,
              chat_type: true,
              created_at: true
            }
          },
          proposal: {
            include: {
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
          }
        }
      });

      return {
        status: 'success',
        message: 'Mensaje creado exitosamente',
        data: message
      };
    } catch (error) {
      console.error('Error en create message:', error);
      return {
        status: 'error',
        message: 'Error al crear el mensaje'
      };
    }
  }

  async findAll() {
    try {
      const messages = await this.prisma.message.findMany({
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
          },
          chat: {
            select: {
              id: true,
              chat_type: true,
              created_at: true
            }
          },
          proposal: {
            include: {
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
          }
        },
        orderBy: { created_at: 'desc' }
      });

      return {
        status: 'success',
        message: 'Mensajes obtenidos exitosamente',
        data: messages
      };
    } catch (error) {
      console.error('Error en findAll messages:', error);
      return {
        status: 'error',
        message: 'Error al obtener los mensajes'
      };
    }
  }

  async findByChat(chatId: number) {
    try {
      const messages = await this.prisma.message.findMany({
        where: { chat_id: chatId },
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
          },
          chat: {
            select: {
              id: true,
              chat_type: true,
              created_at: true
            }
          },
          proposal: {
            include: {
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
          }
        },
        orderBy: { created_at: 'asc' }
      });

      return {
        status: 'success',
        message: 'Mensajes del chat obtenidos exitosamente',
        data: messages
      };
    } catch (error) {
      console.error('Error en findByChat messages:', error);
      return {
        status: 'error',
        message: 'Error al obtener los mensajes del chat'
      };
    }
  }

  async getChat(issuerId: number, receiverId: number) {
    try {
      // Verificar que ambos usuarios existen
      const [issuer, receiver] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: issuerId } }),
        this.prisma.user.findUnique({ where: { id: receiverId } })
      ]);

      if (!issuer || !receiver) {
        return {
          status: 'error',
          message: 'Uno o ambos usuarios no existen'
        };
      }

      // Buscar chat existente entre estos dos usuarios
      let chat = await this.prisma.chat.findFirst({
        where: {
          AND: [
            {
              OR: [
                { issuer_id: issuerId, receiver_id: receiverId },
                { issuer_id: receiverId, receiver_id: issuerId }
              ]
            }
          ]
        },
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
          },
          messages: {
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
              },
              proposal: {
            include: {
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
          }
            },
            orderBy: { created_at: 'asc' }
          }
        }
      });

      // Si no existe el chat, crearlo
      if (!chat) {
        chat = await this.prisma.chat.create({
          data: {
            issuer_id: issuerId,
            receiver_id: receiverId,
            chat_type: 'private',
            message_text: {}
          },
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
            },
            messages: {
              include: {
                issuer: {
                  select: {
                    id: true,
                    first_name: true,
                    first_surname: true,
                    email: true,
                    profilePhoto: true
                  }
                },
                receiver: {
                  select: {
                    id: true,
                    first_name: true,
                    first_surname: true,
                    email: true,
                    profilePhoto: true
                  }
                },
                proposal: {
            include: {
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
          }
              },
              orderBy: { created_at: 'asc' }
            }
          }
        });
      }

      return {
        status: 'success',
        message: 'Chat obtenido exitosamente',
        data: chat
      };
    } catch (error) {
      console.error('Error en getChat:', error);
      return {
        status: 'error',
        message: 'Error al obtener el chat'
      };
    }
  }

  async getChatByUser(chatId: number, userId: number) {
    try {
      // Verificar que el usuario existe
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return {
          status: 'error',
          message: 'Usuario no encontrado'
        };
      }

      // Buscar el chat y verificar que el usuario es participante
      const chat = await this.prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [
            { issuer_id: userId },
            { receiver_id: userId }
          ]
        },
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
          },
          messages: {
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
              },
              proposal: {
                include: {
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
              }
            },
            orderBy: { created_at: 'asc' }
          }
        }
      });

      if (!chat) {
        return {
          status: 'error',
          message: 'Chat no encontrado o no tienes permisos para acceder a este chat'
        };
      }

      // Determinar quién es el otro usuario
      const otherUser = chat.issuer_id === userId ? chat.receiver : chat.issuer;
      const isIssuer = chat.issuer_id === userId;

      return {
        status: 'success',
        message: 'Chat obtenido exitosamente',
        data: {
          chat: {
            id: chat.id,
            chat_type: chat.chat_type,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            issuer_id: chat.issuer_id,
            receiver_id: chat.receiver_id,
            issuer: chat.issuer,
            receiver: chat.receiver,
            messages: chat.messages,
            // Información adicional para el frontend
            other_user: otherUser,
            is_issuer: isIssuer,
            unread_count: 0 // Podrías calcular esto si tienes un campo de estado de lectura
          }
        }
      };
    } catch (error) {
      console.error('Error en getChatByUser:', error);
      return {
        status: 'error',
        message: 'Error al obtener el chat'
      };
    }
  }

  async findByUser(userId: number) {
    try {
      const messages = await this.prisma.message.findMany({
        where: {
          OR: [
            { issuer_id: userId },
            { receiver_id: userId }
          ]
        },
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
          },
          chat: {
            select: {
              id: true,
              chat_type: true,
              created_at: true
            }
          },
          proposal: {
            include: {
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
          }
        },
        orderBy: { created_at: 'desc' }
      });

      return {
        status: 'success',
        message: 'Mensajes del usuario obtenidos exitosamente',
        data: messages
      };
    } catch (error) {
      console.error('Error en findByUser messages:', error);
      return {
        status: 'error',
        message: 'Error al obtener los mensajes del usuario'
      };
    }
  }

  async findOne(id: number) {
    try {
      const message = await this.prisma.message.findUnique({
        where: { id },
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
          },
          chat: {
            select: {
              id: true,
              chat_type: true,
              created_at: true
            }
          },
          proposal: {
            include: {
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
          }
        }
      });

      // Debug: Verificar si el mensaje tiene propuesta asociada
      if (message && message.type_message === 'proposal') {
        
        // Verificar directamente en la base de datos
        const proposalCheck = await this.prisma.jobProposal.findUnique({
          where: { message_id: id },
          include: {
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
      }

      if (!message) {
        return {
          status: 'warning',
          message: 'Mensaje no encontrado'
        };
      }

      return {
        status: 'success',
        message: 'Mensaje encontrado',
        data: message
      };
    } catch (error) {
      console.error('Error en findOne message:', error);
      return {
        status: 'error',
        message: 'Error al obtener el mensaje'
      };
    }
  }

  async update(id: number, updateMessageDto: UpdateMessageDto) {
    try {
      const existingMessage = await this.prisma.message.findUnique({
        where: { id }
      });

      if (!existingMessage) {
        return {
          status: 'warning',
          message: 'Mensaje no encontrado'
        };
      }

      const message = await this.prisma.message.update({
        where: { id },
        data: updateMessageDto,
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
          },
          chat: {
            select: {
              id: true,
              chat_type: true,
              created_at: true
            }
          },
          proposal: {
            include: {
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
          }
        }
      });

      return {
        status: 'success',
        message: 'Mensaje actualizado exitosamente',
        data: message
      };
    } catch (error) {
      console.error('Error en update message:', error);
      return {
        status: 'error',
        message: 'Error al actualizar el mensaje'
      };
    }
  }

  async remove(id: number) {
    try {
      const existingMessage = await this.prisma.message.findUnique({
        where: { id }
      });

      if (!existingMessage) {
        return {
          status: 'warning',
          message: 'Mensaje no encontrado'
        };
      }

      await this.prisma.message.delete({
        where: { id }
      });

      return {
        status: 'success',
        message: 'Mensaje eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error en remove message:', error);
      return {
        status: 'error',
        message: 'Error al eliminar el mensaje'
      };
    }
  }

  // Método para verificar y arreglar mensajes huérfanos
  async fixOrphanedProposalMessages() {
    try {
      // Buscar mensajes con type_message: "proposal" que no tienen propuesta asociada
      const orphanedMessages = await this.prisma.message.findMany({
        where: {
          type_message: 'proposal',
          proposal: null
        },
        include: {
          issuer: true,
          receiver: true
        }
      });

      for (const message of orphanedMessages) {
        
        // Crear una propuesta básica para este mensaje
        const proposal = await this.prisma.jobProposal.create({
          data: {
            message_id: message.id,
            user_id: message.issuer_id, // El emisor es quien hace la propuesta
            issuer_id: message.issuer_id,
            receiver_id: message.receiver_id,
            title: message.title || 'Propuesta de trabajo',
            description: message.message || 'Sin descripción',
            status: 'active'
          },
          include: {
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

      }

      return {
        status: 'success',
        message: `Se procesaron ${orphanedMessages.length} mensajes huérfanos`,
        data: { processedCount: orphanedMessages.length }
      };
    } catch (error) {
      console.error('Error en fixOrphanedProposalMessages:', error);
      return {
        status: 'error',
        message: 'Error al procesar mensajes huérfanos'
      };
    }
  }

  async updateStatus(id: number, updateStatusDto: UpdateMessageStatusDto) {
    try {
      const existingMessage = await this.prisma.message.findUnique({
        where: { id },
        include: {
          proposal: true
        }
      });

      if (!existingMessage) {
        return {
          status: 'warning',
          message: 'Mensaje no encontrado'
        };
      }

      let updateData: any = {};
      
      // Si se está actualizando el message_status
      if (updateStatusDto.message_status) {
        updateData.message_status = updateStatusDto.message_status;
      }

      // Si se está actualizando el proposal_status
      if (updateStatusDto.proposal_status) {
        if (!existingMessage.proposal) {
          return {
            status: 'warning',
            message: 'Este mensaje no tiene una propuesta asociada'
          };
        }
        
        // Si es confirmed_payment, actualizar los campos de los usuarios
        if (updateStatusDto.proposal_status === 'confirmed_payment') {
          // Obtener la propuesta con los IDs de los usuarios
          const proposal = await this.prisma.jobProposal.findUnique({
            where: { message_id: id },
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

        // Actualizar el status de la propuesta usando SQL raw con manejo de errores
        try {
          await this.prisma.$executeRaw`
            UPDATE "JobProposal" 
            SET status = ${updateStatusDto.proposal_status}::"ProposalStatus"
            WHERE message_id = ${id}
          `;
        } catch (error) {
          // Si falla el cast al enum, intentar agregar el valor al enum dinámicamente
          if (error.code === '42804') {
            await this.prisma.$executeRaw`
              ALTER TYPE "ProposalStatus" ADD VALUE IF NOT EXISTS ${updateStatusDto.proposal_status}
            `;
            await this.prisma.$executeRaw`
              UPDATE "JobProposal" 
              SET status = ${updateStatusDto.proposal_status}::"ProposalStatus"
              WHERE message_id = ${id}
            `;
          } else {
            throw error;
          }
        }

        // Si el status es completed_work, actualizar contadores de usuarios
        if (updateStatusDto.proposal_status === 'completed_work') {
          // Verificar que el mensaje es de tipo proposal
          if (existingMessage.type_message === 'proposal') {
            // Incrementar completed_works para el receptor (receiver)
            await this.prisma.$executeRaw`
              UPDATE users 
              SET completed_works = completed_works + 1 
              WHERE id = ${existingMessage.receiver_id}
            `;

            // Incrementar paid_jobs para el emisor (issuer)
            await this.prisma.$executeRaw`
              UPDATE users 
              SET paid_jobs = paid_jobs + 1 
              WHERE id = ${existingMessage.issuer_id}
            `;

          }
        }
      }

      // Obtener el mensaje actualizado con todas las relaciones
      const message = await this.prisma.message.findUnique({
        where: { id },
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
          },
          chat: {
            select: {
              id: true,
              chat_type: true,
              created_at: true
            }
          },
          proposal: {
            include: {
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
          }
        }
      });

      // Preparar respuesta con información adicional si es completed_work
      let responseMessage = 'Estado actualizado exitosamente';
      let additionalInfo: any = null;

      if (updateStatusDto.proposal_status === 'completed_work' && existingMessage.type_message === 'proposal') {
        responseMessage = '🎉 ¡Trabajo marcado como completado! Contadores actualizados.';
        additionalInfo = {
          workCompleted: true,
          receiverUpdated: `Usuario ${existingMessage.receiver_id}: +1 trabajos completados`,
          issuerUpdated: `Usuario ${existingMessage.issuer_id}: +1 trabajos pagados`,
          message: 'Los contadores de trabajos han sido actualizados exitosamente'
        };
      }

      return {
        status: 'success',
        message: responseMessage,
        data: message,
        additionalInfo
      };
    } catch (error) {
      console.error('Error en updateStatus message:', error);
      return {
        status: 'error',
        message: 'Error al actualizar el estado'
      };
    }
  }
}
