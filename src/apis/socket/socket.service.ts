import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SocketService {
  private connectedUsers = new Map<string, any>();
  private subscriptions = new Map<string, any>();

  constructor(
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
  ) {}

  addUser(userId: string, socketId: string, userData: any) {
    this.connectedUsers.set(socketId, {
      userId,
      socketId,
      ...userData,
      connectedAt: new Date(),
    });
  }

  removeUser(socketId: string) {
    const user = this.connectedUsers.get(socketId);
    if (user) {
      // Unsubscribe from Supabase channels if any
      const subscription = this.subscriptions.get(socketId);
      if (subscription) {
        this.supabaseService.unsubscribeFromChannel(subscription);
        this.subscriptions.delete(socketId);
      }
      
      this.connectedUsers.delete(socketId);
    }
  }

  getUser(socketId: string) {
    return this.connectedUsers.get(socketId);
  }

  getUserByUserId(userId: string) {
    for (const [socketId, user] of this.connectedUsers) {
      if (user.userId.toString() === userId.toString()) {
        return { socketId, user };
      }
    }
    return null;
  }

  getAllUsers() {
    return Array.from(this.connectedUsers.values());
  }

  async subscribeToUserChannel(socketId: string, userId: string) {
    try {
      const channel = `user_${userId}`;
      const subscription = await this.supabaseService.subscribeToChannel(
        channel,
        (payload) => {
          // Emit to specific socket
          const user = this.connectedUsers.get(socketId);
          if (user) {
            // This will be handled by the gateway
            return payload;
          }
        }
      );

      this.subscriptions.set(socketId, subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to user channel:', error);
      throw error;
    }
  }

  async broadcastToRoom(room: string, event: string, data: any) {
    // This method can be used to broadcast to specific rooms
    // Implementation depends on your specific needs
    return { room, event, data };
  }

  async sendToUser(userId: string, event: string, data: any) {
    const userConnection = this.getUserByUserId(userId);
    if (userConnection) {
      return {
        socketId: userConnection.socketId,
        event,
        data,
      };
    }
    return null;
  }


  // Funciones específicas para mensajes
  async getUserChatSummaries(userId: string) {
    try {
      // Obtener todos los chats donde el usuario es issuer o receiver
      const chats = await this.prisma.chat.findMany({
        where: {
          OR: [
            { issuer_id: parseInt(userId) },
            { receiver_id: parseInt(userId) }
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
            orderBy: { created_at: 'desc' },
            take: 1, // Solo el último mensaje
            select: {
              id: true,
              message: true,
              type_message: true,
              message_status: true,
              created_at: true,
              issuer_id: true,
              receiver_id: true
            }
          }
        },
        orderBy: { updated_at: 'desc' }
      });

      // Formatear los datos para el frontend
      const formattedChats = chats.map(chat => {
        const lastMessage = chat.messages[0] || null;
        const otherUser = chat.issuer_id === parseInt(userId) ? chat.receiver : chat.issuer;
        
        return {
          id: chat.id,
          user_id: otherUser.id,
          issuer_id: chat.issuer_id,
          receiver_id: chat.receiver_id,
          issuer: chat.issuer,
          receiver: chat.receiver,
          previous_message: lastMessage,
          chat_type: chat.chat_type,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          // Información adicional para el frontend
          other_user: otherUser,
          is_issuer: chat.issuer_id === parseInt(userId),
          unread_count: 0 // Podrías calcular esto si tienes un campo de estado de lectura
        };
      });

      return formattedChats;
    } catch (error) {
      console.error('Error getting user chat summaries:', error);
      return [];
    }
  }

  async markMessageAsDelivered(messageId: string) {
    // Marcar mensaje como entregado
    return { messageId, status: 'delivered' };
  }

  async markMessageAsRead(messageId: string, userId: string) {
    // Marcar mensaje como leído
    return { messageId, userId, status: 'read' };
  }

  async getMessagesParticipant(chatId: string, userId: string) {
    // Obtener mensajes de un chat específico
    return { chatId, userId, messages: [] };
  }

  async sendNewMessage(messageData: any) {
    try {
      // Validar que los campos requeridos estén presentes
      if (!messageData.issuer_id || !messageData.receiver_id || !messageData.chat_id || !messageData.message) {
        return {
          status: 'error',
          message: 'Faltan campos requeridos: issuer_id, receiver_id, chat_id, message',
          data: null
        };
      }

      // Crear el mensaje en la base de datos
      const message = await this.prisma.message.create({
        data: {
          issuer_id: messageData.issuer_id,
          receiver_id: messageData.receiver_id,
          chat_id: messageData.chat_id,
          message: messageData.message,
          type_message: messageData.type_message || 'normal', // Usar el tipo del frontend o 'normal' por defecto
          message_status: 'sent',
          last_message_sender: messageData.issuer_id.toString(),
          unread_count: 0,
          is_online: true
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
          proposal: true
        }
      });

      // Actualizar el chat con la fecha de actualización
      await this.prisma.chat.update({
        where: { id: messageData.chat_id },
        data: { updated_at: new Date() }
      });

      return {
        status: 'success',
        message: 'Mensaje enviado exitosamente',
        data: message
      };
    } catch (error) {
      console.error('Error sending new message:', error);
      return {
        status: 'error',
        message: 'Error al enviar el mensaje',
        data: null
      };
    }
  }
}
