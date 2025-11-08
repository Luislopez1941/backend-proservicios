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

  constructor(
    private socketService: SocketService,
    private supabaseService: SupabaseService,
  ) {}

  @SubscribeMessage('get-chats-user')
  async handleGetChatsUser(client: Socket, data: { userId: string }) {
    try {
      const user = this.socketService.getUser(client.id);
      
      if (!user) {
        this.logger.warn(`Unauthenticated user attempted to get chats: ${client.id}`);
        client.emit('get-chats-user-error', { 
          success: false, 
          message: 'Usuario no autenticado',
          code: 'UNAUTHENTICATED'
        });
        return;
      }

      if (!data.userId) {
        client.emit('get-chats-user-error', { 
          success: false, 
          message: 'ID de usuario requerido',
          code: 'MISSING_USER_ID'
        });
        return;
      }

      const chats = await this.socketService.getUserChatSummaries(data.userId);
      const result = {
        success: true,
        chats: chats,
      };
      
      client.emit('get-chats-user', result);
      this.logger.log(`Chats retrieved successfully for user ${data.userId}`);
    } catch (error) {
      this.logger.error('Error getting chats user:', error);
      client.emit('get-chats-user-error', { 
        success: false, 
        message: 'Error al obtener chats',
        code: 'FETCH_ERROR'
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
            }, 1000);
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
      const user = this.socketService.getUser(client.id);
      
      if (user) {
        this.logger.log(`User ${user.email} disconnected`);
        
        // Remover usuario de la lista de conectados
        this.socketService.removeUser(client.id);

        // Notificar a otros usuarios sobre la desconexión
        client.broadcast.emit('user_disconnected', {
          userId: user.userId,
          socketId: client.id,
        });
      }
    } catch (error) {
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
      const user = this.socketService.getUser(client.id);
      
      if (!user) {
        this.logger.warn(`Unauthenticated user attempted to send message: ${client.id}`);
        client.emit('send-message-error', { 
          success: false, 
          message: 'Usuario no autenticado',
          code: 'UNAUTHENTICATED'
        });
        return;
      }

      // Validar datos requeridos
      if (!data.message || !data.issuer_id || !data.receiver_id || !data.chat_id) {
        this.logger.warn(`Invalid message data from user ${user.email}:`, data);
        client.emit('send-message-error', { 
          success: false, 
          message: 'Datos de mensaje incompletos',
          code: 'INVALID_DATA'
        });
        return;
      }

      this.logger.log(`Processing message from ${user.email} to chat ${data.chat_id}`);

      const result = await this.socketService.sendNewMessage(data);

      if (result.status === 'success') {
        // Usar estrategia múltiple para asegurar que el mensaje llegue
        const messagePayload = {
          ...result.data,
          issuer_id: data.issuer_id,
          receiver_id: data.receiver_id,
          chat_id: data.chat_id,
          room: data.room
        };
        
        // Enviar mensaje en tiempo real SOLO al receptor
        const sendResult = await this.sendRealtimeMessage({
          ...messagePayload,
          issuer_id: data.issuer_id,
          receiver_id: data.receiver_id,
          chat_id: data.chat_id
        });
        
        // Confirmar al emisor que el mensaje fue enviado
        client.emit('send-message-success', { 
          success: true, 
          message: 'Mensaje enviado exitosamente',
          data: result.data,
          deliveryStatus: sendResult
        });
        
        // Enviar evento 'send-message' SOLO al emisor
        client.emit('send-message', {
          ...result.data,
          eventType: 'send-message',
          timestamp: new Date().toISOString()
        });
        
        this.logger.log(`Message sent successfully by ${user.email} with delivery status:`, sendResult);
      } else {
        this.logger.error(`Failed to send message from ${user.email}:`, result.message);
        client.emit('send-message-error', { 
          success: false, 
          message: result.message || 'Error al enviar el mensaje',
          code: 'SEND_FAILED'
        });
      }

    } catch (error) {
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
      const user = this.socketService.getUser(client.id);
      
      if (!user) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      const onlineUsers = this.socketService.getAllUsers();
      client.emit('online_users', onlineUsers);
    } catch (error) {
      this.logger.error('Error getting online users:', error);
      client.emit('error', { message: 'Failed to get online users' });
    }
  }

  // Método para enviar mensaje a un usuario específico
  async sendToUser(userId: string, event: string, data: any) {
    const userConnection = this.socketService.getUserByUserId(userId);
    if (userConnection) {
      // Verificar si el socket sigue conectado
      const socket = this.server.sockets.sockets.get(userConnection.socketId);
      if (socket && socket.connected) {
        this.server.to(userConnection.socketId).emit(event, data);
        this.logger.log(`✅ Sent '${event}' to user ${userId} (socket: ${userConnection.socketId}) - CONNECTED`);
        return true;
      } else {
        this.logger.warn(`❌ User ${userId} socket ${userConnection.socketId} is DISCONNECTED`);
        // Remover usuario desconectado
        this.socketService.removeUser(userConnection.socketId);
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

    for (const user of users) {
      const socket = this.server.sockets.sockets.get(user.socketId);
      if (socket && socket.connected) {
        connectedUsers.push({ userId: user.userId, email: user.email, socketId: user.socketId });
      } else {
        disconnectedUsers.push({ userId: user.userId, email: user.email, socketId: user.socketId });
        // Limpiar usuarios desconectados
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
      const user = this.socketService.getUser(client.id);
      if (!user) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Marcar mensajes como leídos
      const result = await this.socketService.markMessageAsRead(data.user.id, user.userId);
      client.emit('messageRead', result);
    } catch (error) {
      this.logger.error('Error marking message as read:', error);
      client.emit('error', { message: 'Failed to mark message as read' });
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
