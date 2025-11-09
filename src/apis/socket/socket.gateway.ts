import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket.service';
import { SupabaseService } from './supabase.service';
import { NotificationService } from '../notification/notification.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Configura esto según tu frontend
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/socket', // Restaurar el namespace para que funcione con tu frontend
  path: '/socket.io',
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 segundos

  constructor(
    private socketService: SocketService,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
  ) {}

  @SubscribeMessage('get-chats-user')
  async handleGetChatsUser(client: Socket, data: { userId: string }) {
    try {
      console.log('========================================');
      console.log('=== SOLICITUD DE CHATS RECIBIDA ===');
      console.log('========================================');
      console.log('Socket ID:', client.id);
      console.log('Data recibida:', JSON.stringify(data, null, 2));
      console.log('Timestamp:', new Date().toISOString());
      
      const user = this.socketService.getUser(client.id);
      console.log('Usuario autenticado:', user ? { userId: user.userId, email: user.email } : 'No autenticado');
      
      if (!user) {
        console.log('❌ Usuario no autenticado');
        this.logger.warn(`Unauthenticated user attempted to get chats: ${client.id}`);
        client.emit('get-chats-user-error', { 
          success: false, 
          message: 'Usuario no autenticado',
          code: 'UNAUTHENTICATED'
        });
        console.log('========================================\n');
        return;
      }

      if (!data || !data.userId) {
        console.log('❌ userId no proporcionado');
        client.emit('get-chats-user-error', { 
          success: false, 
          message: 'ID de usuario requerido',
          code: 'MISSING_USER_ID'
        });
        console.log('========================================\n');
        return;
      }

      console.log('Buscando chats para usuario:', data.userId);
      const chats = await this.socketService.getUserChatSummaries(data.userId);
      console.log('Chats encontrados:', chats.length);
      
      // Verificar previous_message antes de enviar
      chats.forEach((chat, index) => {
        if (chat.previous_message) {
          const hasUnreadCount = 'unread_count' in chat.previous_message;
          console.log(`Chat ${index + 1} (ID: ${chat.id}) - previous_message:`);
          console.log(`  - Tiene unread_count:`, hasUnreadCount);
          if (hasUnreadCount) {
            console.log(`  - unread_count value:`, chat.previous_message.unread_count);
          } else {
            console.error(`  ❌ ERROR: NO tiene unread_count!`);
            console.error(`  previous_message completo:`, JSON.stringify(chat.previous_message, null, 2));
          }
        }
      });
      
      // FORZAR unread_count en previous_message antes de enviar
      chats.forEach((chat) => {
        if (chat.previous_message) {
          const unreadCount = chat.unread_count || 0;
          
          // Usar Object.defineProperty para asegurar que se incluya en la serialización
          if (!('unread_count' in chat.previous_message) || chat.previous_message.unread_count === undefined) {
            console.log(`⚠️ GATEWAY: Forzando unread_count en chat ${chat.id} = ${unreadCount}`);
            
            // Definir la propiedad de forma explícita
            Object.defineProperty(chat.previous_message, 'unread_count', {
              value: unreadCount,
              writable: true,
              enumerable: true,
              configurable: true
            });
            
            // También asignar directamente
            chat.previous_message.unread_count = unreadCount;
          } else {
            // Asegurar que el valor no sea undefined
            if (chat.previous_message.unread_count === undefined || chat.previous_message.unread_count === null) {
              chat.previous_message.unread_count = unreadCount;
            }
          }
        }
      });
      
      console.log('Primeros 3 chats (completo):', JSON.stringify(chats.slice(0, 3), null, 2));
      
      const result = {
        success: true,
        chats: chats,
      };
      
      // Verificar el resultado antes de enviar y FORZAR unread_count en TODOS los chats
      console.log('📤 Verificando resultado antes de enviar...');
      result.chats.forEach((chat: any, index: number) => {
        if (chat.previous_message) {
          const unreadCount = chat.unread_count || 0;
          
          // SIEMPRE asegurar que tiene unread_count
          if (!('unread_count' in chat.previous_message) || 
              chat.previous_message.unread_count === undefined || 
              chat.previous_message.unread_count === null) {
            console.log(`⚠️ GATEWAY: Forzando unread_count en chat ${chat.id} (índice ${index}) = ${unreadCount}`);
            
            // Usar Object.defineProperty para asegurar que se incluya
            Object.defineProperty(chat.previous_message, 'unread_count', {
              value: unreadCount,
              writable: true,
              enumerable: true,
              configurable: true
            });
            
            // También asignar directamente
            chat.previous_message.unread_count = unreadCount;
          }
          
          if (index === 0) {
            // Log detallado solo para el primer chat
            console.log('Primer chat - previous_message:', {
              id: chat.previous_message.id,
              has_unread_count: 'unread_count' in chat.previous_message,
              unread_count: chat.previous_message.unread_count,
              all_keys: Object.keys(chat.previous_message)
            });
          }
        }
      });
      
      // Verificar serialización JSON final
      const testJson = JSON.stringify(result.chats[0] || {});
      const testParsed = JSON.parse(testJson);
      if (testParsed.previous_message) {
        console.log('🔍 GATEWAY: Verificación JSON final - previous_message tiene unread_count:', 'unread_count' in testParsed.previous_message);
        if ('unread_count' in testParsed.previous_message) {
          console.log('  ✅ unread_count en JSON:', testParsed.previous_message.unread_count);
        } else {
          console.error('  ❌ unread_count NO está en JSON serializado!');
        }
      }
      
      console.log('Enviando respuesta con', chats.length, 'chats');
      client.emit('get-chats-user', result);
      this.logger.log(`Chats retrieved successfully for user ${data.userId}`);
      
      // Emitir solo los conteos (mensajes y notificaciones no leídas)
      // La lista completa de notificaciones se obtiene por API cuando se necesita
      await this.emitUnreadCount(parseInt(data.userId), client.id);
      
      console.log('✅ Respuesta enviada exitosamente');
      console.log('========================================\n');
    } catch (error) {
      console.error('❌ Error en get-chats-user:', error);
      console.error('Stack trace:', error.stack);
      this.logger.error('Error getting chats user:', error);
      client.emit('get-chats-user-error', { 
        success: false, 
        message: 'Error al obtener chats',
        code: 'FETCH_ERROR',
        error: error.message
      });
      console.log('========================================\n');
    }
  }

  // Función helper para emitir el total de mensajes y notificaciones no leídas a un usuario
  private async emitUnreadCount(userId: number, socketId?: string) {
    try {
      // Calcular mensajes no leídos
      const totalUnreadMessages = await this.socketService.calculateTotalUnreadCount(userId);
      
      // Calcular notificaciones no leídas
      const notificationsData = await this.notificationService.findAllByUserId(userId.toString());
      const totalUnreadNotifications = notificationsData.data?.unreadCount || 0;
      
      const payload = {
        unreadMessagesCount: totalUnreadMessages,      // Mensajes de chat no leídos
        unreadNotificationsCount: totalUnreadNotifications, // Notificaciones no leídas
        userId: userId,
        timestamp: new Date().toISOString()
      };
      
      // Si se proporciona socketId, emitir solo a ese socket
      if (socketId) {
        this.server.to(socketId).emit('unread-count', payload);
      } else {
        // Emitir a la sala del usuario (todos sus sockets)
        this.server.to(`user_${userId}`).emit('unread-count', payload);
      }
      
      console.log(`📊 Conteos para usuario ${userId}:`, {
        mensajes: totalUnreadMessages,
        notificaciones: totalUnreadNotifications
      });
    } catch (error) {
      console.error('Error emitting unread count:', error);
    }
  }

  // Handler para solicitar el total de mensajes no leídos
  @SubscribeMessage('get-unread-count')
  async handleGetUnreadCount(client: Socket, data: { userId?: string }) {
    try {
      const user = this.socketService.getUser(client.id);
      
      if (!user) {
        client.emit('unread-count-error', { 
          success: false, 
          message: 'Usuario no autenticado' 
        });
        return;
      }

      const userId = data?.userId ? parseInt(data.userId) : user.userId;
      await this.emitUnreadCount(userId, client.id);
    } catch (error) {
      console.error('Error in handleGetUnreadCount:', error);
      client.emit('unread-count-error', { 
        success: false, 
        message: 'Error al obtener mensajes no leídos' 
      });
    }
  }

  async handleConnection(client: Socket) {
    this.logger.log(`New connection attempt: ${client.id}`);
    
    try {
      // Verificar autenticación
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`No token provided for client: ${client.id}`);
        client.emit('error', { message: 'Authentication token required' });
        client.disconnect();
        return;
      }

      // Intentar verificar con JWT propio primero (más rápido)
      let user: any = null;
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'proservicios');
        
        user = {
          id: decoded.sub,
          email: decoded.email,
          user_metadata: {
            type_user: decoded.type_user
          }
        };
      } catch (jwtError) {
        this.logger.error(`JWT verification failed:`, jwtError.message);
        
        // Intentar con Supabase como fallback
        user = await this.supabaseService.verifyToken(token);
      }
      
          if (!user) {
            this.logger.warn(`Invalid token for client: ${client.id}`);
            client.emit('connection-error', { 
              message: 'Token de autenticación inválido',
              code: 'INVALID_TOKEN'
            });
            // Dar tiempo para que el cliente reciba el error antes de desconectar
            setTimeout(() => {
              client.disconnect();
            }, 2000);
            return;
          }

      // Agregar usuario a la lista de conectados
      this.socketService.addUser(user.id, client.id, {
        email: user.email,
        user_metadata: user.user_metadata,
      });

      // Suscribirse a canales de Supabase para este usuario
      await this.socketService.subscribeToUserChannel(client.id, user.id);

          // Unir al usuario a su sala personal
          client.join(`user_${user.id}`);

          this.logger.log(`User ${user.email} (ID: ${user.id}) connected with socket ${client.id}`);

          // Log de usuarios conectados
          this.getConnectedUsers();

          // Emitir total de mensajes no leídos al conectar
          await this.emitUnreadCount(user.id, client.id);

          // Notificar al cliente que se conectó exitosamente
          client.emit('connected', {
            message: 'Conectado exitosamente',
            user: {
              id: user.id,
              email: user.email,
            },
            socketId: client.id,
            timestamp: new Date().toISOString()
          });

          // Enviar ping inicial para mantener conexión activa
          setTimeout(() => {
            client.emit('ping', { 
              message: 'Manteniendo conexión activa',
              timestamp: new Date().toISOString()
            });
          }, 5000);

      // Obtener usuarios que tienen chats con este usuario
      const userIdsWithChats = await this.socketService.getUserIdsWithChats(user.id.toString());
      
      // Notificar a usuarios que tienen chats con este usuario que está online
      for (const relatedUserId of userIdsWithChats) {
        await this.sendToUser(relatedUserId.toString(), 'user-online', {
          user_id: user.id,
          is_online: true,
          timestamp: new Date().toISOString()
        });
      }

      // Emitir user-status-changed a todos los usuarios conectados
      if (this.server) {
        this.server.emit('user-status-changed', {
          user_id: user.id,
          is_online: true,
          timestamp: new Date().toISOString()
        });
      }

      // Notificar a otros usuarios sobre la conexión (opcional)
      client.broadcast.emit('user_connected', {
        userId: user.id,
        socketId: client.id,
      });

    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      console.log('========================================');
      console.log('=== USUARIO DESCONECTADO ===');
      console.log('========================================');
      console.log('Socket ID:', client.id);
      console.log('Timestamp:', new Date().toISOString());
      
      const user = this.socketService.getUser(client.id);
      
      if (user) {
        console.log('Usuario desconectado:', { userId: user.userId, email: user.email });
        this.logger.log(`User ${user.email} disconnected`);
        
        // Obtener usuarios que tienen chats con este usuario antes de removerlo
        const userIdsWithChats = await this.socketService.getUserIdsWithChats(user.userId.toString());
        console.log('Usuarios con chats relacionados:', userIdsWithChats);
        
        // Remover usuario de la lista de conectados
        this.socketService.removeUser(client.id);
        console.log('Usuario removido de la lista de conectados');

        // Notificar a usuarios que tienen chats con este usuario que está offline
        console.log('Enviando notificaciones user-offline...');
        for (const relatedUserId of userIdsWithChats) {
          const sent = await this.sendToUser(relatedUserId.toString(), 'user-offline', {
            user_id: user.userId,
            is_online: false,
            timestamp: new Date().toISOString()
          });
          console.log(`Notificación enviada a usuario ${relatedUserId}:`, sent ? '✅' : '❌');
        }

        // Emitir user-status-changed a todos los usuarios conectados
        if (this.server) {
          this.server.emit('user-status-changed', {
            user_id: user.userId,
            is_online: false,
            timestamp: new Date().toISOString()
          });
        }

        // Notificar a otros usuarios sobre la desconexión (opcional)
        client.broadcast.emit('user_disconnected', {
          userId: user.userId,
          socketId: client.id,
        });
        
        console.log('✅ Proceso de desconexión completado');
        console.log('========================================\n');
      } else {
        console.log('⚠️ Usuario no encontrado en la lista de conectados');
        console.log('========================================\n');
      }
    } catch (error) {
      console.error('❌ Error en handleDisconnect:', error);
      this.logger.error(`Disconnect error for client ${client.id}:`, error);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    try {
      const user = this.socketService.getUser(client.id);
      
      if (!user) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      client.join(data.room);
      client.emit('joined_room', { room: data.room });
      
      this.logger.log(`User ${user.email} joined room: ${data.room}`);
    } catch (error) {
      this.logger.error('Error joining room:', error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    try {
      const user = this.socketService.getUser(client.id);
      
      if (!user) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      client.leave(data.room);
      client.emit('left_room', { room: data.room });
      
      this.logger.log(`User ${user.email} left room: ${data.room}`);
    } catch (error) {
      this.logger.error('Error leaving room:', error);
      client.emit('error', { message: 'Failed to leave room' });
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string; message: string; type?: string; issuer_id: number; receiver_id: number; chat_id: number },
  ) {
    try {
      console.log('========================================');
      console.log('=== EVENTO send-message RECIBIDO ===');
      console.log('========================================');
      console.log('Socket ID:', client.id);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Data recibida:', JSON.stringify(data, null, 2));
      
      const user = this.socketService.getUser(client.id);
      console.log('Usuario autenticado:', user ? { userId: user.userId, email: user.email } : 'No autenticado');
      
      if (!user) {
        console.log('❌ Usuario no autenticado');
        this.logger.warn(`Unauthenticated user attempted to send message: ${client.id}`);
        client.emit('send-message-error', { 
          success: false, 
          message: 'Usuario no autenticado',
          code: 'UNAUTHENTICATED'
        });
        console.log('========================================\n');
        return;
      }

      // Validar datos requeridos
      if (!data.message || !data.issuer_id || !data.receiver_id || !data.chat_id) {
        console.log('❌ Datos incompletos');
        this.logger.warn(`Invalid message data from user ${user.email}:`, data);
        client.emit('send-message-error', { 
          success: false, 
          message: 'Datos de mensaje incompletos',
          code: 'INVALID_DATA'
        });
        console.log('========================================\n');
        return;
      }

      console.log(`📤 Procesando mensaje de ${user.email} al chat ${data.chat_id}`);
      console.log('Campos del mensaje:');
      console.log('  - message:', data.message);
      console.log('  - issuer_id:', data.issuer_id);
      console.log('  - receiver_id:', data.receiver_id);
      console.log('  - chat_id:', data.chat_id);
      console.log('  - room:', data.room);
      console.log('  - type:', data.type);

      const result = await this.socketService.sendNewMessage(data);
      console.log('Resultado de sendNewMessage:', JSON.stringify(result, null, 2));

      if (result.status === 'success') {
        console.log('✅ Mensaje guardado exitosamente en BD');
        console.log('Mensaje creado:', JSON.stringify(result.data, null, 2));
        
        const messagePayload = {
          ...result.data,
          issuer_id: data.issuer_id,
          receiver_id: data.receiver_id,
          chat_id: data.chat_id,
          room: data.room
        };
        
        // Enviar mensaje en tiempo real SOLO al receptor
        console.log('📨 Enviando mensaje en tiempo real al receptor...');
        const sendResult = await this.sendRealtimeMessage({
          ...messagePayload,
          issuer_id: data.issuer_id,
          receiver_id: data.receiver_id,
          chat_id: data.chat_id
        });
        console.log('Resultado de sendRealtimeMessage:', sendResult);
        
        // Actualizar estado a "delivered" si el receptor está conectado
        if (sendResult.receiverSent && result.data) {
          console.log('✅ Receptor conectado, actualizando estado a "delivered"');
          await this.socketService.updateMessageStatus(result.data.id, 'delivered');
        } else {
          console.log('⚠️ Receptor no conectado, estado permanece como "sent"');
        }
        
        // Obtener chats actualizados para ambos usuarios
        console.log('📋 Obteniendo chats actualizados...');
        const issuerChats = await this.socketService.getUserChatSummaries(data.issuer_id.toString());
        const receiverChats = await this.socketService.getUserChatSummaries(data.receiver_id.toString());
        console.log(`Chats del emisor (${data.issuer_id}):`, issuerChats.length, 'chats');
        console.log(`Chats del receptor (${data.receiver_id}):`, receiverChats.length, 'chats');
        
        // Emitir 'send-message' al emisor con newMessage
        if (result.data) {
          console.log('📤 Emitiendo send-message al emisor');
          client.emit('send-message', {
            newMessage: result.data
          });
        }
        
        // Emitir 'received-message' al receptor (ya se hace en sendRealtimeMessage)
        // Pero también actualizar sus chats
        console.log('📥 Actualizando chats del receptor...');
        await this.sendToUser(data.receiver_id.toString(), 'get-chats-user', {
          success: true,
          chats: receiverChats
        });
        
        // Actualizar chats del emisor
        console.log('📥 Actualizando chats del emisor...');
        client.emit('get-chats-user', {
          success: true,
          chats: issuerChats
        });
        
        // Crear notificación para el usuario receptor
        try {
          console.log('🔔 Creando notificación para el usuario receptor...');
          const notification = await this.notificationService.create({
            user_id: data.receiver_id,
            from_user_id: data.issuer_id,
            type: 'message_received',
            title: 'Nuevo mensaje recibido',
            message: data.message.length > 100 ? data.message.substring(0, 100) + '...' : data.message,
            is_read: false,
            metadata: {
              chat_id: data.chat_id,
              message_id: result.data?.id,
              issuer_id: data.issuer_id,
              receiver_id: data.receiver_id
            }
          });
          console.log('✅ Notificación creada:', notification.data?.id);
        } catch (notificationError) {
          console.error('⚠️ Error al crear notificación:', notificationError);
          // No fallar el proceso si la notificación falla
        }

        // Actualizar conteos de mensajes y notificaciones para ambos usuarios
        // Solo enviamos los conteos, NO la lista completa (eso se obtiene por API cuando se necesita)
        await this.emitUnreadCount(data.receiver_id);
        await this.emitUnreadCount(data.issuer_id, client.id);
        
        console.log('✅ Proceso de envío completado');
        console.log('========================================\n');
        this.logger.log(`Message sent successfully by ${user.email}`);
      } else {
        console.log('❌ Error al enviar mensaje:', result.message);
        this.logger.error(`Failed to send message from ${user.email}:`, result.message);
        client.emit('send-message-error', { 
          success: false, 
          message: result.message || 'Error al enviar el mensaje',
          code: 'SEND_FAILED'
        });
        console.log('========================================\n');
      }

    } catch (error) {
      console.error('❌ Error inesperado en send-message:', error);
      console.error('Stack trace:', error.stack);
      this.logger.error('Unexpected error sending message:', error);
      
      // Enviar error sin desconectar al cliente
      client.emit('send-message-error', { 
        success: false, 
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
      
      // NO desconectar al cliente, solo loggear el error
      this.logger.warn(`Error handled for client ${client.id}, connection maintained`);
    }
  }

  // Método para manejar el evento de typing
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { issuer_id: number; receiver_id: number; chat_id: number; is_typing: boolean; room?: string }
  ) {
    try {
      const user = this.socketService.getUser(client.id);
      
      if (!user) {
        this.logger.warn(`Unauthenticated user attempted to send typing event: ${client.id}`);
        return;
      }

      // Validar datos requeridos
      if (data.issuer_id === undefined || data.receiver_id === undefined || data.is_typing === undefined) {
        this.logger.warn(`Invalid typing data from user ${user.email}:`, data);
        return;
      }

      // Reenviar el evento de typing al receptor
      const typingData = {
        issuer_id: data.issuer_id,
        receiver_id: data.receiver_id,
        chat_id: data.chat_id,
        is_typing: data.is_typing,
        room: data.room,
        timestamp: new Date().toISOString()
      };

      // Enviar el evento de typing SOLO al receptor
      await this.sendToUser(data.receiver_id.toString(), 'typing', typingData);

      this.logger.log(`Typing event sent from ${data.issuer_id} to ${data.receiver_id}: ${data.is_typing}`);

    } catch (error) {
      this.logger.error('Error handling typing event:', error);
    }
  }

  // Método para confirmar que el mensaje fue recibido
  @SubscribeMessage('message-received-confirmation')
  async handleMessageReceivedConfirmation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: number; userId: number }
  ) {
    try {
      const user = this.socketService.getUser(client.id);
      
      if (!user) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      this.logger.log(`Message ${data.messageId} received confirmation from user ${data.userId}`);
      
      // Notificar al emisor que el mensaje fue recibido
      await this.sendToUser(data.userId.toString(), 'message-delivered', {
        messageId: data.messageId,
        receivedBy: user.userId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.logger.error('Error handling message received confirmation:', error);
      client.emit('error', { message: 'Failed to confirm message received' });
    }
  }

  @SubscribeMessage('get_online_users')
  async handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    try {
      console.log('========================================');
      console.log('=== EVENTO get_online_users RECIBIDO ===');
      console.log('========================================');
      console.log('Socket ID:', client.id);
      console.log('Timestamp:', new Date().toISOString());
      
      const user = this.socketService.getUser(client.id);
      console.log('Usuario autenticado:', user ? { userId: user.userId, email: user.email } : 'No autenticado');
      
      if (!user) {
        console.log('❌ Usuario no autenticado, emitiendo error');
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Obtener todos los usuarios y verificar que realmente estén conectados
      const allUsers = this.socketService.getAllUsers();
      console.log('Total usuarios en lista (antes de verificar conexión):', allUsers.length);
      
      // Verificar que los sockets realmente estén conectados
      const actuallyConnectedUserIds: number[] = [];
      
      if (this.server && this.server.sockets && this.server.sockets.sockets) {
        for (const userData of allUsers) {
          try {
            const socket = this.server.sockets.sockets.get(userData.socketId);
            if (socket && socket.connected) {
              const userId = parseInt(userData.userId.toString());
              if (!actuallyConnectedUserIds.includes(userId)) {
                actuallyConnectedUserIds.push(userId);
              }
            } else {
              // Socket no está conectado, removerlo de la lista
              console.log(`⚠️ Socket ${userData.socketId} no está conectado, removiendo...`);
              this.socketService.removeUser(userData.socketId);
            }
          } catch (error) {
            console.error(`Error verificando socket ${userData.socketId}:`, error);
            this.socketService.removeUser(userData.socketId);
          }
        }
      } else {
        // Si no podemos verificar, usar la lista tal cual pero filtrar duplicados
        const uniqueUserIds = [...new Set(allUsers.map(u => parseInt(u.userId.toString())))];
        actuallyConnectedUserIds.push(...uniqueUserIds);
      }
      
      console.log('Usuarios realmente conectados:', actuallyConnectedUserIds);
      console.log('Cantidad de usuarios únicos conectados:', actuallyConnectedUserIds.length);
      
      // Emitir array de IDs de usuarios online
      console.log('Enviando respuesta online_users:', actuallyConnectedUserIds);
      client.emit('online_users', actuallyConnectedUserIds);
      
      console.log(`✅ Online users sent to ${user.email}: ${actuallyConnectedUserIds.length} users`);
      console.log('========================================\n');
      
      this.logger.log(`Online users sent to ${user.email}: ${actuallyConnectedUserIds.length} users`, actuallyConnectedUserIds);
    } catch (error) {
      console.error('❌ Error en get_online_users:', error);
      this.logger.error('Error getting online users:', error);
      client.emit('error', { message: 'Failed to get online users' });
    }
  }

  // Método para enviar mensaje a un usuario específico
  async sendToUser(userId: string, event: string, data: any) {
    if (!this.server) {
      this.logger.warn(`❌ Server not available`);
      return false;
    }

    const userConnection = this.socketService.getUserByUserId(userId);
    if (userConnection) {
      try {
        // Enviar directamente usando Socket.IO - maneja automáticamente si el socket no existe
        this.server.to(userConnection.socketId).emit(event, data);
        this.logger.log(`✅ Sent '${event}' to user ${userId} (socket: ${userConnection.socketId})`);
        return true;
      } catch (error) {
        this.logger.error(`❌ Error sending '${event}' to user ${userId}:`, error);
        return false;
      }
    }
    this.logger.warn(`❌ User ${userId} not found in connected users`);
    return false;
  }

  // Método para verificar usuarios conectados
  getConnectedUsers() {
    const users = this.socketService.getAllUsers();
    // Filtrar duplicados por userId
    const uniqueUsers = users.filter((user, index, self) => 
      index === self.findIndex(u => u.userId === user.userId)
    );
    this.logger.log(`Connected users: ${uniqueUsers.length}`, uniqueUsers.map(u => ({ userId: u.userId, email: u.email })));
    return uniqueUsers;
  }

  // Método para verificar estado real de conexiones
  verifyConnectionStatus() {
    const users = this.socketService.getAllUsers();
    const connectedUsers: any[] = [];
    const disconnectedUsers: any[] = [];

    if (!this.server || !this.server.sockets || !this.server.sockets.sockets) {
      this.logger.warn(`❌ Server sockets not available for connection status check`);
      return { connectedUsers, disconnectedUsers };
    }

    for (const user of users) {
      try {
        const socket = this.server.sockets.sockets.get(user.socketId);
        if (socket && socket.connected) {
          connectedUsers.push({ userId: user.userId, email: user.email, socketId: user.socketId });
        } else {
          disconnectedUsers.push({ userId: user.userId, email: user.email, socketId: user.socketId });
          // Limpiar usuarios desconectados
          this.socketService.removeUser(user.socketId);
        }
      } catch (error) {
        this.logger.warn(`Error checking socket ${user.socketId}:`, error);
        disconnectedUsers.push({ userId: user.userId, email: user.email, socketId: user.socketId });
        this.socketService.removeUser(user.socketId);
      }
    }

    this.logger.log(`🔍 Connection Status Check:`);
    this.logger.log(`✅ Actually connected: ${connectedUsers.length}`, connectedUsers);
    this.logger.log(`❌ Actually disconnected: ${disconnectedUsers.length}`, disconnectedUsers);

    return { connectedUsers, disconnectedUsers };
  }

  // Método para debuggear salas
  debugRooms() {
    try {
      if (this.server && this.server.sockets && this.server.sockets.adapter) {
        const rooms = this.server.sockets.adapter.rooms;
        this.logger.log('Available rooms:', Array.from(rooms.keys()));
        return Array.from(rooms.keys());
      } else {
        this.logger.warn('Server or adapter not available for room debugging');
        return [];
      }
    } catch (error) {
      this.logger.error('Error debugging rooms:', error);
      return [];
    }
  }

  // Método para enviar mensaje a una sala
  async sendToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  // Método para broadcast global
  async broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Método para notificar nuevos mensajes automáticamente
  async notifyNewMessage(messageData: any) {
    try {
      const { issuer_id, receiver_id, chat_id } = messageData;
      
      // Enviar a ambos usuarios específicos
      await this.sendToUser(issuer_id.toString(), 'new_message_received', messageData);
      await this.sendToUser(receiver_id.toString(), 'new_message_received', messageData);
      
      // También enviar a la sala del chat
      await this.sendToRoom(`chat_${chat_id}`, 'new_message_received', messageData);
      
      this.logger.log(`New message notification sent to users ${issuer_id} and ${receiver_id}`);
    } catch (error) {
      this.logger.error('Error notifying new message:', error);
    }
  }

  // Método mejorado para enviar mensajes con múltiples estrategias
  async sendMessageWithMultipleStrategies(messageData: any, eventName: string = 'new_message') {
    try {
      const { issuer_id, receiver_id, chat_id, room } = messageData;
      
      this.logger.log(`Sending message with multiple strategies to users ${issuer_id} and ${receiver_id}`);
      
      let issuerSent = false;
      let receiverSent = false;
      
      // Estrategia 1: Enviar por socket ID específico
      try {
        issuerSent = await this.sendToUser(issuer_id.toString(), eventName, messageData);
        receiverSent = await this.sendToUser(receiver_id.toString(), eventName, messageData);
      } catch (error) {
        this.logger.warn('Error in strategy 1 (socket ID):', error.message);
      }
      
      // Estrategia 2: Enviar por salas de usuario
      try {
        this.server.to(`user_${issuer_id}`).emit(eventName, messageData);
        this.server.to(`user_${receiver_id}`).emit(eventName, messageData);
        this.logger.log(`Sent to user rooms: user_${issuer_id}, user_${receiver_id}`);
      } catch (error) {
        this.logger.warn('Error in strategy 2 (user rooms):', error.message);
      }
      
      // Estrategia 3: Enviar por sala de chat
      try {
        this.server.to(`chat_${chat_id}`).emit(eventName, messageData);
        this.logger.log(`Sent to chat room: chat_${chat_id}`);
      } catch (error) {
        this.logger.warn('Error in strategy 3 (chat room):', error.message);
      }
      
      // Estrategia 4: Enviar por sala específica si existe
      if (room) {
        try {
          this.server.to(room).emit(eventName, messageData);
          this.logger.log(`Sent to specific room: ${room}`);
        } catch (error) {
          this.logger.warn('Error in strategy 4 (specific room):', error.message);
        }
      }
      
      // Estrategia 5: Broadcast global como último recurso
      try {
        this.server.emit(eventName, messageData);
        this.logger.log('Sent via global broadcast');
      } catch (error) {
        this.logger.warn('Error in strategy 5 (global broadcast):', error.message);
      }
      
      this.logger.log(`Message sent with multiple strategies - Issuer: ${issuerSent}, Receiver: ${receiverSent}`);
      
      return { issuerSent, receiverSent };
    } catch (error) {
      this.logger.error('Error sending message with multiple strategies:', error);
      return { issuerSent: false, receiverSent: false };
    }
  }

  // Método específico para enviar mensajes en tiempo real SOLO al receptor
  async sendRealtimeMessage(messageData: any) {
    try {
      const { issuer_id, receiver_id, chat_id } = messageData;
      
      this.logger.log(`📨 Sending real-time message from ${issuer_id} to ${receiver_id}`);
      
      // Enviar SOLO al receptor usando múltiples estrategias
      let receiverSent = false;
      
      // Estrategia 1: Socket directo del receptor
      try {
        receiverSent = await this.sendToUser(receiver_id.toString(), 'received-message', {
          ...messageData,
          eventType: 'received-message',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        this.logger.warn('Error sending to receiver socket:', error.message);
      }
      
      // Estrategia 2: Sala personal del receptor (si no se envió por socket directo)
      if (!receiverSent) {
        try {
          this.server.to(`user_${receiver_id}`).emit('received-message', {
            ...messageData,
            eventType: 'received-message',
            timestamp: new Date().toISOString()
          });
          receiverSent = true;
        } catch (error) {
          this.logger.warn('Error sending to user room:', error.message);
        }
      }
      
      // Estrategia 3: Sala del chat (excluyendo al emisor)
      try {
        this.server.to(`chat_${chat_id}`).except(`user_${issuer_id}`).emit('received-message', {
          ...messageData,
          eventType: 'received-message',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        this.logger.warn('Error sending to chat room:', error.message);
      }
      
      this.logger.log(`📨 Real-time message sent - Receiver: ${receiverSent}`);
      
      return { receiverSent };
    } catch (error) {
      this.logger.error('Error sending real-time message:', error);
      return { receiverSent: false };
    }
  }

  // Método para enviar mensaje a múltiples usuarios
  async sendToUsers(userIds: string[], event: string, message: any): Promise<number> {
    let sentCount = 0;
    for (const userId of userIds) {
      const sent = await this.sendToUser(userId, event, message);
      if (sent) sentCount++;
    }
    this.logger.log(`Sent event '${event}' to ${sentCount}/${userIds.length} users`);
    return sentCount;
  }

  // Método para mantener conexión activa
  @SubscribeMessage('ping')
  async handlePing(client: Socket) {
    try {
      const user = this.socketService.getUser(client.id);
      if (user) {
        // Actualizar timestamp del último ping
        this.socketService.updateLastPing(client.id);
        
        client.emit('pong', { 
          timestamp: new Date().toISOString(),
          userId: user.userId,
          socketId: client.id,
          connected: true
        });
        this.logger.log(`Ping received from ${user.email} (${user.userId})`);
      } else {
        client.emit('pong', { 
          timestamp: new Date().toISOString(),
          connected: false,
          error: 'User not found'
        });
      }
    } catch (error) {
      this.logger.error('Error handling ping:', error);
      client.emit('pong', { 
        timestamp: new Date().toISOString(),
        connected: false,
        error: error.message
      });
    }
  }

  // Evento para desconexión explícita del usuario
  @SubscribeMessage('user-disconnect')
  async handleUserDisconnect(@ConnectedSocket() client: Socket) {
    try {
      const user = this.socketService.getUser(client.id);
      
      if (user) {
        console.log('Usuario solicitando desconexión:', { userId: user.userId, email: user.email });
        
        // Obtener usuarios que tienen chats con este usuario
        const userIdsWithChats = await this.socketService.getUserIdsWithChats(user.userId.toString());
        
        // Remover usuario de la lista de conectados
        this.socketService.removeUser(client.id);
        
        // Notificar a usuarios que tienen chats con este usuario
        for (const relatedUserId of userIdsWithChats) {
          await this.sendToUser(relatedUserId.toString(), 'user-offline', {
            user_id: user.userId,
            is_online: false,
            timestamp: new Date().toISOString()
          });
        }
        
        // Emitir user-status-changed a todos los usuarios conectados
        if (this.server) {
          this.server.emit('user-status-changed', {
            user_id: user.userId,
            is_online: false,
            timestamp: new Date().toISOString()
          });
        }
        
        // Desconectar el socket
        client.disconnect();
        
        this.logger.log(`User ${user.email} disconnected via user-disconnect event`);
      }
    } catch (error) {
      this.logger.error('Error handling user-disconnect:', error);
    }
  }

  // Evento para cuando el usuario cierra sesión explícitamente
  @SubscribeMessage('logout')
  async handleLogout(@ConnectedSocket() client: Socket) {
    try {
      console.log('========================================');
      console.log('=== LOGOUT EXPLÍCITO ===');
      console.log('========================================');
      console.log('Socket ID:', client.id);
      console.log('Timestamp:', new Date().toISOString());
      
      const user = this.socketService.getUser(client.id);
      
      if (user) {
        console.log('Usuario cerrando sesión:', { userId: user.userId, email: user.email });
        
        // Obtener usuarios que tienen chats con este usuario
        const userIdsWithChats = await this.socketService.getUserIdsWithChats(user.userId.toString());
        console.log('Usuarios con chats relacionados:', userIdsWithChats);
        
        // Notificar a usuarios que tienen chats con este usuario que está offline
        for (const relatedUserId of userIdsWithChats) {
          await this.sendToUser(relatedUserId.toString(), 'user-offline', {
            user_id: user.userId,
            is_online: false,
            timestamp: new Date().toISOString()
          });
        }
        
        // Remover usuario de la lista de conectados
        this.socketService.removeUser(client.id);
        console.log('Usuario removido de la lista de conectados');
        
        // Confirmar logout al cliente
        client.emit('logout-success', {
          message: 'Sesión cerrada exitosamente',
          timestamp: new Date().toISOString()
        });
        
        // Desconectar el socket
        client.disconnect();
        
        console.log('✅ Logout completado');
        console.log('========================================\n');
      } else {
        console.log('⚠️ Usuario no encontrado');
        client.emit('logout-error', { message: 'Usuario no autenticado' });
        console.log('========================================\n');
      }
    } catch (error) {
      console.error('❌ Error en handleLogout:', error);
      this.logger.error('Error handling logout:', error);
      client.emit('logout-error', { message: 'Error al cerrar sesión' });
    }
  }

  // Método para verificar estado de conexión del cliente
  @SubscribeMessage('check-connection')
  async handleCheckConnection(client: Socket) {
    try {
      const user = this.socketService.getUser(client.id);
      const isConnected = client.connected;
      
      client.emit('connection-status', {
        connected: isConnected,
        authenticated: !!user,
        userId: user?.userId,
        email: user?.email,
        socketId: client.id,
        timestamp: new Date().toISOString()
      });
      
      this.logger.log(`Connection check for ${user?.email || 'unknown'} - Connected: ${isConnected}`);
    } catch (error) {
      this.logger.error('Error checking connection:', error);
      client.emit('connection-status', {
        connected: false,
        authenticated: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Método para unirse automáticamente a salas de chat
  @SubscribeMessage('join-chat')
  async handleJoinChat(client: Socket, data: { chatId: string; userId: string }) {
    try {
      const user = this.socketService.getUser(client.id);
      
      if (!user) {
        client.emit('join-chat-error', { 
          success: false, 
          message: 'Usuario no autenticado',
          code: 'UNAUTHENTICATED'
        });
        return;
      }

      // Unirse a la sala del chat
      client.join(`chat_${data.chatId}`);
      
      // También unirse a la sala personal del usuario
      client.join(`user_${data.userId}`);
      
      client.emit('join-chat-success', { 
        success: true, 
        message: 'Unido al chat exitosamente',
        chatId: data.chatId,
        userId: data.userId
      });
      
      this.logger.log(`User ${user.email} joined chat ${data.chatId}`);
    } catch (error) {
      this.logger.error('Error joining chat:', error);
      client.emit('join-chat-error', { 
        success: false, 
        message: 'Error al unirse al chat',
        code: 'JOIN_ERROR'
      });
    }
  }

  // Eventos específicos para mensajes
  @SubscribeMessage('connectionChats')
  async handleConnectionChats(client: Socket, userId: string) {
    try {
      const user = this.socketService.getUser(client.id);
      
      if (!user) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      const chatSummaries = await this.socketService.getUserChatSummaries(userId);
      client.emit('connectionChats', chatSummaries);
    } catch (error) {
      this.logger.error('Error getting chat summaries:', error);
      client.emit('error', { message: 'Failed to get chat summaries' });
    }
  }

  @SubscribeMessage('messageDelivered')
  async handleMessageDelivered(client: Socket, messageId: string) {
    try {
      const user = this.socketService.getUser(client.id);
      if (!user) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Marcar mensaje como entregado
      const result = await this.socketService.markMessageAsDelivered(messageId);
      client.emit('messageDelivered', result);
    } catch (error) {
      this.logger.error('Error marking message as delivered:', error);
      client.emit('error', { message: 'Failed to mark message as delivered' });
    }
  }

  @SubscribeMessage('messageRead')
  async handleMessageRead(client: Socket, data: { user: any }) {
    try {
      console.log('========================================');
      console.log('=== EVENTO messageRead RECIBIDO ===');
      console.log('========================================');
      console.log('Socket ID:', client.id);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Data recibida:', JSON.stringify(data, null, 2));
      
      const user = this.socketService.getUser(client.id);
      console.log('Usuario autenticado:', user ? { userId: user.userId, email: user.email } : 'No autenticado');
      
      if (!user) {
        console.log('❌ Usuario no autenticado');
        client.emit('error', { message: 'User not authenticated' });
        console.log('========================================\n');
        return;
      }

      // Obtener chat_id del previous_message
      const chatId = data.user?.previous_message?.chat_id;
      console.log('Chat ID extraído:', chatId);
      
      if (!chatId) {
        console.log('❌ Chat ID no encontrado en previous_message');
        client.emit('error', { message: 'Chat ID not found in previous_message' });
        console.log('========================================\n');
        return;
      }

      console.log(`📖 Marcando mensajes como leídos para usuario ${user.userId} en chat ${chatId}`);
      
      // Marcar todos los mensajes del chat como leídos
      await this.socketService.markMessagesAsRead(chatId, user.userId);
      console.log('✅ Mensajes marcados como leídos');

      // Obtener chats actualizados para el usuario actual
      console.log('📋 Obteniendo chats actualizados del usuario...');
      const userChats = await this.socketService.getUserChatSummaries(user.userId.toString());
      console.log(`Chats del usuario:`, userChats.length, 'chats');
      
      // Obtener el otro usuario del chat para actualizar sus chats también
      // Acceder a prisma a través del servicio
      const prismaService = (this.socketService as any).prisma;
      const chat = await prismaService.chat.findUnique({
        where: { id: chatId },
        select: { issuer_id: true, receiver_id: true }
      });
      console.log('Chat encontrado:', chat);

      if (chat) {
        const otherUserId = chat.issuer_id === user.userId ? chat.receiver_id : chat.issuer_id;
        console.log('ID del otro usuario:', otherUserId);
        
        const otherUserChats = await this.socketService.getUserChatSummaries(otherUserId.toString());
        console.log(`Chats del otro usuario:`, otherUserChats.length, 'chats');
        
        // Emitir actualización al otro usuario si está conectado
        console.log('📥 Actualizando chats del otro usuario...');
        await this.sendToUser(otherUserId.toString(), 'get-chats-user', {
          success: true,
          chats: otherUserChats
        });
      }

      // Emitir actualización al usuario actual
      console.log('📥 Emitiendo actualización de chats al usuario actual...');
      client.emit('get-chats-user', {
        success: true,
        chats: userChats
      });

      // Actualizar total de mensajes no leídos para ambos usuarios
      await this.emitUnreadCount(user.userId, client.id);
      if (chat) {
        const otherUserId = chat.issuer_id === user.userId ? chat.receiver_id : chat.issuer_id;
        await this.emitUnreadCount(otherUserId);
      }

      console.log('✅ Proceso de messageRead completado');
      console.log('========================================\n');
      this.logger.log(`Messages marked as read for user ${user.userId} in chat ${chatId}`);
    } catch (error) {
      console.error('❌ Error en messageRead:', error);
      console.error('Stack trace:', error.stack);
      this.logger.error('Error marking message as read:', error);
      client.emit('error', { message: 'Failed to mark message as read' });
      console.log('========================================\n');
    }
  }

  @SubscribeMessage('newMessage')
  async handleNewMessage(client: Socket, messageData: any) {
    try {
      const user = this.socketService.getUser(client.id);
      if (!user) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Procesar nuevo mensaje
      const result = await this.socketService.sendNewMessage(messageData);
      
      // Enviar a todos los usuarios conectados
      this.server.emit('newMessage', result);
    } catch (error) {
      this.logger.error('Error sending new message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }
}
