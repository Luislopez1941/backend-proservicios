import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@ApiTags('Notificaciones')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('create')
  @ApiOperation({ 
    summary: 'Crear notificación', 
    description: 'Crea una nueva notificación para un usuario' 
  })
  @ApiBody({ type: CreateNotificationDto })
  @ApiResponse({ status: 201, description: 'Notificación creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Get('get-notifications-by-user/:userId')
  @ApiOperation({ 
    summary: 'Obtener notificaciones por usuario', 
    description: 'Obtiene todas las notificaciones de un usuario, ordenadas por fecha de creación (más recientes primero). Incluye el conteo de notificaciones no leídas.' 
  })
  @ApiParam({ 
    name: 'userId', 
    description: 'ID del usuario', 
    type: Number,
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notificaciones obtenidas exitosamente',
    schema: {
      example: {
        status: 'success',
        message: 'Notificaciones obtenidas exitosamente',
        data: {
          notifications: [
            {
              id: 1,
              user_id: 1,
              from_user_id: 2,
              type: 'proposal_received',
              title: 'Nueva propuesta recibida',
              message: 'Has recibido una nueva propuesta',
              is_read: false,
              read_at: null,
              job_id: null,
              proposal_id: 1,
              metadata: null,
              created_at: '2025-11-09T00:30:00.000Z',
              updated_at: '2025-11-09T00:30:00.000Z',
              fromUser: {
                id: 2,
                first_name: 'Juan',
                first_surname: 'Pérez',
                email: 'juan@example.com',
                profilePhoto: null
              },
              job: null,
              proposal: {
                id: 1,
                title: 'Propuesta de trabajo',
                status: 'active'
              }
            }
          ],
          unreadCount: 5,
          total: 10
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findAllByUserId(@Param('userId') userId: string) {
    return this.notificationService.findAllByUserId(userId);
  }

  @Patch('mark-all-as-read/:userId')
  @ApiOperation({ 
    summary: 'Marcar todas las notificaciones como leídas', 
    description: 'Marcar todas las notificaciones de un usuario como leídas' 
  })
  @ApiParam({ 
    name: 'userId', 
    description: 'ID del usuario', 
    type: Number,
    example: 1
  })
  @ApiResponse({ status: 200, description: 'Notificaciones marcadas como leídas exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async markAllAsRead(@Param('userId') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Patch('mark-as-read/:id')
  @ApiOperation({ 
    summary: 'Marcar notificación como leída', 
    description: 'Marcar una notificación específica como leída por su ID' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la notificación', 
    type: Number,
    example: 1
  })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída exitosamente' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(+id);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener notificación por ID', 
    description: 'Obtiene una notificación específica por su ID' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la notificación', 
    type: Number,
    example: 1
  })
  @ApiResponse({ status: 200, description: 'Notificación obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async findOne(@Param('id') id: string) {
    return this.notificationService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Actualizar notificación', 
    description: 'Actualiza una notificación existente (útil para marcar como leída)' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la notificación', 
    type: Number,
    example: 1
  })
  @ApiBody({ type: UpdateNotificationDto })
  @ApiResponse({ status: 200, description: 'Notificación actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationService.update(+id, updateNotificationDto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Eliminar notificación', 
    description: 'Elimina una notificación por su ID' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la notificación', 
    type: Number,
    example: 1
  })
  @ApiResponse({ status: 200, description: 'Notificación eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async remove(@Param('id') id: string) {
    return this.notificationService.remove(+id);
  }
}
