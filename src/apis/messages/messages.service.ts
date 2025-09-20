import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

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
}
