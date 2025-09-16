import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

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
          chat: {
            select: {
              id: true,
              chat_type: true,
              created_at: true
            }
          },
          proposal: true
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
          chat: {
            select: {
              id: true,
              chat_type: true,
              created_at: true
            }
          },
          proposal: true
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
          proposal: true
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
          chat: {
            select: {
              id: true,
              chat_type: true,
              created_at: true
            }
          },
          proposal: true
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
          chat: {
            select: {
              id: true,
              chat_type: true,
              created_at: true
            }
          },
          proposal: true
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
          chat: {
            select: {
              id: true,
              chat_type: true,
              created_at: true
            }
          },
          proposal: true
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
