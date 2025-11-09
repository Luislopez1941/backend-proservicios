import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    try {
      const notification = await this.prisma.notification.create({
        data: createNotificationDto,
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
            },
          },
          fromUser: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          proposal: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      return {
        status: 'success',
        message: 'Notificación creada exitosamente',
        data: notification,
      };
    } catch (error) {
      throw new Error(`Error al crear notificación: ${error.message}`);
    }
  }

  async findAllByUserId(userId: string) {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          user_id: parseInt(userId),
        },
        include: {
          fromUser: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          proposal: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Contar notificaciones no leídas
      const unreadCount = notifications.filter((n) => !n.is_read).length;

      return {
        status: 'success',
        message: 'Notificaciones obtenidas exitosamente',
        data: {
          notifications,
          unreadCount,
          total: notifications.length,
        },
      };
    } catch (error) {
      throw new Error(`Error al obtener notificaciones: ${error.message}`);
    }
  }

  async findOne(id: number) {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
            },
          },
          fromUser: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          proposal: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      if (!notification) {
        throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
      }

      return {
        status: 'success',
        message: 'Notificación obtenida exitosamente',
        data: notification,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error al obtener notificación: ${error.message}`);
    }
  }

  async update(id: number, updateNotificationDto: UpdateNotificationDto) {
    try {
      const notification = await this.prisma.notification.update({
        where: { id },
        data: updateNotificationDto,
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
            },
          },
          fromUser: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          proposal: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      return {
        status: 'success',
        message: 'Notificación actualizada exitosamente',
        data: notification,
      };
    } catch (error) {
      throw new Error(`Error al actualizar notificación: ${error.message}`);
    }
  }

  async markAsRead(id: number) {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
      }

      const updatedNotification = await this.prisma.notification.update({
        where: { id },
        data: {
          is_read: true,
          read_at: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
            },
          },
          fromUser: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              profilePhoto: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          proposal: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      return {
        status: 'success',
        message: 'Notificación marcada como leída exitosamente',
        data: updatedNotification,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error al marcar notificación como leída: ${error.message}`);
    }
  }

  async markAllAsRead(userId: string) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          user_id: parseInt(userId),
          is_read: false,
        },
        data: {
          is_read: true,
          read_at: new Date(),
        },
      });

      return {
        status: 'success',
        message: 'Todas las notificaciones marcadas como leídas exitosamente',
        data: {
          count: result.count,
          userId: parseInt(userId),
        },
      };
    } catch (error) {
      throw new Error(`Error al marcar todas las notificaciones como leídas: ${error.message}`);
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.notification.delete({
        where: { id },
      });

      return {
        status: 'success',
        message: 'Notificación eliminada exitosamente',
      };
    } catch (error) {
      throw new Error(`Error al eliminar notificación: ${error.message}`);
    }
  }
}
