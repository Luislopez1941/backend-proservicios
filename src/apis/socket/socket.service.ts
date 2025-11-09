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
      lastPing: new Date(), // Rastrear último ping
    });
  }

  updateLastPing(socketId: string) {
    const user = this.connectedUsers.get(socketId);
    if (user) {
      user.lastPing = new Date();
      this.connectedUsers.set(socketId, user);
    }
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
      console.log('========================================');
      console.log('=== getUserChatSummaries - INICIO ===');
      console.log('========================================');
      console.log('userId:', userId);
      
      // Obtener todos los chats donde el usuario es issuer o receiver
      console.log('🔍 Buscando chats en BD...');
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
              updated_at: true,
              issuer_id: true,
              receiver_id: true,
              chat_id: true
            }
          }
        },
        orderBy: { updated_at: 'desc' }
      });
      
      console.log(`✅ Chats encontrados:`, chats.length);

      // Formatear los datos para el frontend
      console.log('🔄 Formateando chats...');
      const formattedChats = await Promise.all(chats.map(async (chat) => {
        const lastMessage = chat.messages[0] || null;
        const otherUser = chat.issuer_id === parseInt(userId) ? chat.receiver : chat.issuer;
        
        // Calcular unread_count para este usuario en este chat
        const unreadCount = await this.calculateUnreadCount(chat.id, parseInt(userId));
        console.log(`  Chat ${chat.id}: unread_count = ${unreadCount}`);
        
        // Si hay último mensaje, construir previousMessage con TODOS los campos necesarios
        let previousMessage: any = null;
        if (lastMessage) {
          // Crear objeto base
          previousMessage = {
            id: lastMessage.id,
            message: lastMessage.message,
            type_message: lastMessage.type_message,
            message_status: lastMessage.message_status,
            created_at: lastMessage.created_at,
            updated_at: lastMessage.updated_at || lastMessage.created_at,
            issuer_id: lastMessage.issuer_id,
            receiver_id: lastMessage.receiver_id,
            chat_id: lastMessage.chat_id || chat.id
          };
          
          // AGREGAR unread_count como propiedad separada para asegurar que se incluya
          Object.defineProperty(previousMessage, 'unread_count', {
            value: unreadCount,
            writable: true,
            enumerable: true,
            configurable: true
          });
          
          // También asignar directamente por si acaso
          previousMessage.unread_count = unreadCount;
          
          // Verificar inmediatamente que tiene unread_count
          if (!('unread_count' in previousMessage)) {
            console.error(`❌ ERROR CRÍTICO: previousMessage NO tiene unread_count después de crearlo!`);
            previousMessage.unread_count = unreadCount; // Forzar agregar
          }
          
          // Verificar que el valor no sea undefined
          if (previousMessage.unread_count === undefined || previousMessage.unread_count === null) {
            previousMessage.unread_count = unreadCount;
          }
        }
        
        console.log(`  previous_message formateado:`, previousMessage ? {
          id: previousMessage.id,
          message_status: previousMessage.message_status,
          unread_count: previousMessage.unread_count,
          has_unread_count_prop: 'unread_count' in previousMessage,
          unread_count_type: typeof previousMessage.unread_count
        } : null);
        
        const formattedChat = {
          id: chat.id,
          user_id: otherUser.id,
          issuer_id: chat.issuer_id,
          receiver_id: chat.receiver_id,
          issuer: chat.issuer,
          receiver: chat.receiver,
          previous_message: previousMessage,
          chat_type: chat.chat_type,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          // Información adicional para el frontend
          other_user: otherUser,
          is_issuer: chat.issuer_id === parseInt(userId),
          unread_count: unreadCount
        };
        
        console.log(`  Chat ${chat.id} formateado:`, {
          id: formattedChat.id,
          user_id: formattedChat.user_id,
          unread_count: formattedChat.unread_count,
          previous_message: previousMessage ? {
            id: previousMessage.id,
            message_status: previousMessage.message_status,
            unread_count: previousMessage.unread_count,
            has_unread_count: 'unread_count' in previousMessage
          } : null
        });
        
        // Verificar que previous_message tiene unread_count
        if (formattedChat.previous_message && !('unread_count' in formattedChat.previous_message)) {
          console.error(`❌ ERROR: previous_message del chat ${chat.id} NO tiene unread_count!`);
          console.error('previous_message:', JSON.stringify(formattedChat.previous_message, null, 2));
        }
        
        return formattedChat;
      }));

      console.log(`✅ Chats formateados:`, formattedChats.length);
      
      // Verificar y asegurar que cada chat tenga unread_count en previous_message
      formattedChats.forEach((chat, index) => {
        if (chat.previous_message) {
          const hasUnreadCount = 'unread_count' in chat.previous_message;
          console.log(`Chat ${index + 1} (ID: ${chat.id}) - previous_message:`);
          console.log(`  - Tiene unread_count:`, hasUnreadCount);
          
          if (!hasUnreadCount) {
            console.error(`❌ ERROR: Chat ${chat.id} - previous_message NO tiene unread_count!`);
            console.error('previous_message antes de corregir:', JSON.stringify(chat.previous_message, null, 2));
            
            // Corregir: agregar unread_count si falta
            const unreadCount = chat.unread_count || 0;
            chat.previous_message = {
              ...chat.previous_message,
              unread_count: unreadCount
            };
            console.log(`  ✅ CORREGIDO: unread_count agregado = ${unreadCount}`);
          } else {
            console.log(`  ✅ unread_count value:`, chat.previous_message.unread_count);
          }
          
          // Verificar después de la corrección
          const hasUnreadCountAfter = 'unread_count' in chat.previous_message;
          console.log(`  - Después de verificación:`, hasUnreadCountAfter ? '✅ OK' : '❌ ERROR');
        }
      });
      
      // Verificar serialización JSON
      const jsonString = JSON.stringify(formattedChats[0] || {});
      const parsedBack = JSON.parse(jsonString);
      if (parsedBack.previous_message) {
        const hasInJson = 'unread_count' in parsedBack.previous_message;
        console.log('📋 Verificación JSON serializado:');
        console.log(`  - previous_message tiene unread_count en JSON:`, hasInJson);
        if (hasInJson) {
          console.log(`  - unread_count en JSON:`, parsedBack.previous_message.unread_count);
        }
      }
      
      // FORZAR que previous_message tenga unread_count antes de retornar (SIEMPRE)
      formattedChats.forEach((chat) => {
        if (chat.previous_message) {
          // SIEMPRE asegurar que tiene unread_count, incluso si es 0
          if (!('unread_count' in chat.previous_message) || chat.previous_message.unread_count === undefined) {
            console.log(`⚠️ FORZANDO unread_count en chat ${chat.id} (campo faltante o undefined)`);
            chat.previous_message.unread_count = chat.unread_count || 0;
          } else {
            // Asegurar que el valor no sea undefined
            if (chat.previous_message.unread_count === undefined) {
              chat.previous_message.unread_count = chat.unread_count || 0;
            }
          }
        }
      });
      
      // Log final con verificación
      if (formattedChats.length > 0 && formattedChats[0].previous_message) {
        const finalCheck = formattedChats[0].previous_message;
        console.log('🔍 VERIFICACIÓN FINAL antes de retornar:');
        console.log(`  - previous_message.id:`, finalCheck.id);
        console.log(`  - previous_message tiene unread_count:`, 'unread_count' in finalCheck);
        console.log(`  - previous_message.unread_count:`, finalCheck.unread_count);
        console.log(`  - Tipo de unread_count:`, typeof finalCheck.unread_count);
      }
      
      console.log('📤 Retornando chats - Primer chat completo:', JSON.stringify(formattedChats[0] || {}, null, 2));
      console.log('========================================\n');
      
      return formattedChats;
    } catch (error) {
      console.error('❌ Error en getUserChatSummaries:', error);
      console.error('Stack trace:', error.stack);
      return [];
    }
  }

  // Obtener IDs de usuarios que tienen chats con un usuario específico
  async getUserIdsWithChats(userId: string): Promise<number[]> {
    try {
      const chats = await this.prisma.chat.findMany({
        where: {
          OR: [
            { issuer_id: parseInt(userId) },
            { receiver_id: parseInt(userId) }
          ]
        },
        select: {
          issuer_id: true,
          receiver_id: true
        }
      });

      // Extraer IDs únicos de usuarios que tienen chats con este usuario
      const userIds = new Set<number>();
      chats.forEach(chat => {
        if (chat.issuer_id !== parseInt(userId)) {
          userIds.add(chat.issuer_id);
        }
        if (chat.receiver_id !== parseInt(userId)) {
          userIds.add(chat.receiver_id);
        }
      });

      return Array.from(userIds);
    } catch (error) {
      console.error('Error getting user IDs with chats:', error);
      return [];
    }
  }

  async markMessageAsDelivered(messageId: string) {
    // Marcar mensaje como entregado
    return { messageId, status: 'delivered' };
  }

  // Actualizar estado de un mensaje específico
  async updateMessageStatus(messageId: number, status: 'sent' | 'delivered' | 'read'): Promise<void> {
    try {
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          message_status: status,
          updated_at: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  }

  // Calcular unread_count para un usuario en un chat
  async calculateUnreadCount(chatId: number, userId: number): Promise<number> {
    try {
      const unreadCount = await this.prisma.message.count({
        where: {
          chat_id: chatId,
          receiver_id: userId,
          message_status: {
            not: 'read'
          }
        }
      });
      return unreadCount;
    } catch (error) {
      console.error('Error calculating unread count:', error);
      return 0;
    }
  }

  // Calcular el total de mensajes no leídos de TODOS los chats de un usuario
  async calculateTotalUnreadCount(userId: number): Promise<number> {
    try {
      // Obtener todos los chats donde el usuario participa
      const chats = await this.prisma.chat.findMany({
        where: {
          OR: [
            { issuer_id: userId },
            { receiver_id: userId }
          ]
        },
        select: {
          id: true
        }
      });

      // Si no hay chats, retornar 0
      if (chats.length === 0) {
        return 0;
      }

      // Extraer los IDs de los chats
      const chatIds = chats.map(chat => chat.id);

      // Contar todos los mensajes no leídos de todos los chats en una sola consulta
      const totalUnread = await this.prisma.message.count({
        where: {
          chat_id: {
            in: chatIds
          },
          receiver_id: userId,
          message_status: {
            not: 'read'
          }
        }
      });

      return totalUnread;
    } catch (error) {
      console.error('Error calculating total unread count:', error);
      return 0;
    }
  }

  // Marcar todos los mensajes de un chat como leídos para un usuario
  async markMessagesAsRead(chatId: number, userId: number): Promise<void> {
    try {
      console.log('========================================');
      console.log('=== markMessagesAsRead - INICIO ===');
      console.log('========================================');
      console.log('chatId:', chatId);
      console.log('userId:', userId);
      
      console.log('🔍 Buscando mensajes no leídos...');
      const unreadMessages = await this.prisma.message.findMany({
        where: {
          chat_id: chatId,
          receiver_id: userId,
          message_status: {
            not: 'read'
          }
        },
        select: { id: true, message_status: true }
      });
      
      console.log(`📬 Mensajes no leídos encontrados:`, unreadMessages.length);
      console.log('IDs de mensajes:', unreadMessages.map(m => m.id));
      
      if (unreadMessages.length > 0) {
        console.log('🔄 Marcando mensajes como leídos...');
        const result = await this.prisma.message.updateMany({
          where: {
            chat_id: chatId,
            receiver_id: userId,
            message_status: {
              not: 'read'
            }
          },
          data: {
            message_status: 'read',
            updated_at: new Date()
          }
        });
        console.log(`✅ Mensajes actualizados:`, result.count);
      } else {
        console.log('ℹ️ No hay mensajes para actualizar');
      }
      
      console.log('========================================\n');
    } catch (error) {
      console.error('❌ Error en markMessagesAsRead:', error);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  async markMessageAsRead(chatId: number, userId: number) {
    try {
      // Marcar todos los mensajes no leídos como leídos
      await this.markMessagesAsRead(chatId, userId);
      
      return {
        status: 'success',
        message: 'Mensajes marcados como leídos',
        chatId,
        userId
      };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return {
        status: 'error',
        message: 'Error al marcar mensajes como leídos',
        chatId,
        userId
      };
    }
  }

  async getMessagesParticipant(chatId: string, userId: string) {
    // Obtener mensajes de un chat específico
    return { chatId, userId, messages: [] };
  }

  async sendNewMessage(messageData: any) {
    try {
      console.log('========================================');
      console.log('=== sendNewMessage - INICIO ===');
      console.log('========================================');
      console.log('messageData recibido:', JSON.stringify(messageData, null, 2));
      
      // Validar que los campos requeridos estén presentes
      if (!messageData.issuer_id || !messageData.receiver_id || !messageData.chat_id || !messageData.message) {
        console.log('❌ Faltan campos requeridos');
        return {
          status: 'error',
          message: 'Faltan campos requeridos: issuer_id, receiver_id, chat_id, message',
          data: null
        };
      }

      console.log('📝 Creando mensaje en BD...');
      console.log('  - issuer_id:', messageData.issuer_id);
      console.log('  - receiver_id:', messageData.receiver_id);
      console.log('  - chat_id:', messageData.chat_id);
      console.log('  - message:', messageData.message);
      console.log('  - type_message:', messageData.type_message || 'normal');

      // Crear el mensaje en la base de datos
      const message = await this.prisma.message.create({
        data: {
          issuer_id: messageData.issuer_id,
          receiver_id: messageData.receiver_id,
          chat_id: messageData.chat_id,
          message: messageData.message,
          type_message: messageData.type_message || 'normal',
          message_status: 'sent', // Estado inicial: sent
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

      console.log('✅ Mensaje creado en BD:', JSON.stringify(message, null, 2));
      console.log('  - ID:', message.id);
      console.log('  - message_status:', message.message_status);
      console.log('  - created_at:', message.created_at);

      // Actualizar el chat con la fecha de actualización
      console.log('🔄 Actualizando fecha del chat...');
      await this.prisma.chat.update({
        where: { id: messageData.chat_id },
        data: { updated_at: new Date() }
      });
      console.log('✅ Chat actualizado');

      const result = {
        status: 'success',
        message: 'Mensaje enviado exitosamente',
        data: message
      };
      
      console.log('📤 Retornando resultado:', JSON.stringify(result, null, 2));
      console.log('========================================\n');
      
      return result;
    } catch (error) {
      console.error('❌ Error en sendNewMessage:', error);
      console.error('Stack trace:', error.stack);
      return {
        status: 'error',
        message: 'Error al enviar el mensaje',
        data: null
      };
    }
  }
}
