import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ValidationPipe } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async create(@Body(ValidationPipe) createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Get()
  async findAll(@Query('chatId') chatId?: string, @Query('userId') userId?: string) {
    if (chatId) {
      return this.messagesService.findByChat(+chatId);
    }
    if (userId) {
      return this.messagesService.findByUser(+userId);
    }
    return this.messagesService.findAll();
  }

  @Get('get-chat/:issuerId/:receiverId')
  async getChat(@Param('issuerId') issuerId: string, @Param('receiverId') receiverId: string) {
    return this.messagesService.getChat(+issuerId, +receiverId);
  }

  @Get('get-chat-by-user/:chatId/:userId')
  async getChatByUser(@Param('chatId') chatId: string, @Param('userId') userId: string) {
    return this.messagesService.getChatByUser(+chatId, +userId);
  } 

  @Get('by-chat/:chatId')
  async findByChat(@Param('chatId') chatId: string) {
    return this.messagesService.findByChat(+chatId);
  }

  @Get('by-user/:userId')
  async findByUser(@Param('userId') userId: string) {
    return this.messagesService.findByUser(+userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.messagesService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body(ValidationPipe) updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(+id, updateMessageDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.messagesService.remove(+id);
  }
}
