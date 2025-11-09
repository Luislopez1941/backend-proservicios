import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SocketService } from './socket.service';
import { SocketGateway } from './socket.gateway';

@Controller('socket')
export class SocketController {
  constructor(
    private socketService: SocketService,
    private socketGateway: SocketGateway,
  ) {}

  @Get('online-users')
  async getOnlineUsers() {
    return {
      users: this.socketService.getAllUsers(),
      count: this.socketService.getAllUsers().length,
    };
  }

  @Post('send-to-user/:userId')
  async sendToUser(
    @Param('userId') userId: string,
    @Body() data: { event: string; message: any },
  ) {
    const result = await this.socketGateway.sendToUser(
      userId,
      data.event,
      data.message,
    );
    
    return {
      success: result,
      message: result ? 'Message sent successfully' : 'User not found or not connected',
    };
  }

  @Post('send-to-room/:room')
  async sendToRoom(
    @Param('room') room: string,
    @Body() data: { event: string; message: any },
  ) {
    await this.socketGateway.sendToRoom(room, data.event, data.message);
    
    return {
      success: true,
      message: 'Message sent to room successfully',
    };
  }

  @Post('broadcast')
  async broadcast(@Body() data: { event: string; message: any }) {
    await this.socketGateway.broadcast(data.event, data.message);
    
    return {
      success: true,
      message: 'Broadcast sent successfully',
    };
  }

  // Endpoints específicos para mensajes
  @Get('user-chat-summaries/:userId')
  async getUserChatSummaries(@Param('userId') userId: string) {
    const summaries = await this.socketService.getUserChatSummaries(userId);
    return {
      success: true,
      data: summaries,
    };
  }

  @Post('mark-message-delivered/:messageId')
  async markMessageDelivered(@Param('messageId') messageId: string) {
    const result = await this.socketService.markMessageAsDelivered(messageId);
    return {
      success: true,
      data: result,
    };
  }

  @Post('mark-message-read')
  async markMessageRead(@Body() data: { chatId: string; userId: string }) {
    const result = await this.socketService.markMessageAsRead(parseInt(data.chatId), parseInt(data.userId));
    return {
      success: true,
      data: result,
    };
  }

  @Get('messages-participant/:chatId/:userId')
  async getMessagesParticipant(
    @Param('chatId') chatId: string,
    @Param('userId') userId: string,
  ) {
    const result = await this.socketService.getMessagesParticipant(chatId, userId);
    return {
      success: true,
      data: result,
    };
  }

  @Post('send-message')
  async sendMessage(@Body() messageData: any) {
    const result = await this.socketService.sendNewMessage(messageData);
    
    // También enviar via Socket.IO
    await this.socketGateway.broadcast('newMessage', result);
    
    return {
      success: true,
      data: result,
    };
  }

  // Endpoints adicionales
  @Get('user-connected/:userId')
  async getUserConnected(@Param('userId') userId: string) {
    return {
      users: this.socketService.getAllUsers(),
      count: this.socketService.getAllUsers().length,
    };
  }

  @Get('get-chats-user/:userId')
  async getChatsUser(@Param('userId') userId: string) {
    const chats = await this.socketService.getUserChatSummaries(userId);
    return {
      success: true,
      chats: chats,
    };
  }
}
