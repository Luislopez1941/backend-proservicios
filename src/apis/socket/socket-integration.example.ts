// Ejemplo de cómo integrar Socket.IO con otros servicios
// Este archivo es solo para referencia, no se incluye en el build

import { Injectable } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';

@Injectable()
export class ExampleIntegrationService {
  constructor(
    private socketGateway: SocketGateway,
    private socketService: SocketService,
  ) {}

  // Ejemplo: Enviar notificación cuando se crea un nuevo mensaje
  async notifyNewMessage(messageData: any) {
    try {
      // Enviar al receptor del mensaje
      const sent = await this.socketGateway.sendToUser(
        messageData.receiver_id,
        'new_message',
        {
          id: messageData.id,
          message: messageData.content,
          sender: messageData.issuer,
          timestamp: messageData.created_at,
          chat_id: messageData.chat_id,
        }
      );

      if (sent) {
        console.log(`Notificación enviada al usuario ${messageData.receiver_id}`);
      } else {
        console.log(`Usuario ${messageData.receiver_id} no está conectado`);
      }

      return { success: sent };
    } catch (error) {
      console.error('Error enviando notificación:', error);
      return { success: false, error: error.message };
    }
  }

  // Ejemplo: Notificar cuando un usuario cambia su estado
  async notifyUserStatusChange(userId: string, status: string) {
    try {
      // Broadcast a todos los usuarios conectados
      await this.socketGateway.broadcast('user_status_changed', {
        userId,
        status,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error notificando cambio de estado:', error);
      return { success: false, error: error.message };
    }
  }

  // Ejemplo: Enviar notificación a una sala específica
  async notifyRoom(roomId: string, event: string, data: any) {
    try {
      await this.socketGateway.sendToRoom(roomId, event, {
        ...data,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error enviando notificación a sala:', error);
      return { success: false, error: error.message };
    }
  }

  // Ejemplo: Obtener estadísticas de conexiones
  async getConnectionStats() {
    const users = this.socketService.getAllUsers();
    
    return {
      total_connected: users.length,
      users: users.map(user => ({
        userId: user.userId,
        email: user.email,
        connectedAt: user.connectedAt,
      })),
    };
  }
}

// Ejemplo de cómo usar en el MessagesService:
/*
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway, // Inyectar el gateway
  ) {}

  async create(createMessageDto: CreateMessageDto) {
    // ... tu lógica existente para crear el mensaje ...
    
    const message = await this.prisma.message.create({
      data: createMessageDto,
      include: {
        issuer: { select: { id: true, first_name: true, email: true } },
        receiver: { select: { id: true, first_name: true, email: true } }
      }
    });

    // Enviar notificación en tiempo real
    await this.socketGateway.sendToUser(
      message.receiver_id,
      'new_message',
      {
        id: message.id,
        content: message.content,
        sender: message.issuer,
        timestamp: message.created_at,
        chat_id: message.chat_id,
      }
    );

    return {
      status: 'success',
      message: 'Mensaje creado exitosamente',
      data: message
    };
  }
}
*/

// Ejemplo de cómo usar en el UserService:
/*
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
  ) {}

  async updateUserStatus(userId: string, status: string) {
    // ... tu lógica para actualizar el estado ...
    
    // Notificar a todos los usuarios conectados
    await this.socketGateway.broadcast('user_status_changed', {
      userId,
      status,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }
}
*/
