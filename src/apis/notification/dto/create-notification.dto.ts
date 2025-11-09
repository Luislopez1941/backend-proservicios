import { IsNotEmpty, IsInt, IsString, IsOptional, IsBoolean, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ 
    description: 'ID del usuario que recibe la notificación', 
    example: 1 
  })
  @IsInt({ message: 'El user_id debe ser un número entero' })
  @IsNotEmpty({ message: 'El user_id es requerido' })
  user_id: number;

  @ApiProperty({ 
    description: 'ID del usuario que envía/crea la notificación', 
    example: 2,
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsInt({ message: 'El from_user_id debe ser un número entero' })
  from_user_id?: number | null;

  @ApiProperty({ 
    description: 'Tipo de notificación', 
    enum: NotificationType,
    example: 'message_received'
  })
  @IsEnum(NotificationType, { message: 'El tipo de notificación no es válido' })
  @IsNotEmpty({ message: 'El tipo es requerido' })
  type: NotificationType;

  @ApiProperty({ 
    description: 'Título de la notificación', 
    example: 'Nuevo mensaje recibido' 
  })
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título es requerido' })
  title: string;

  @ApiProperty({ 
    description: 'Mensaje de la notificación', 
    example: 'Has recibido un nuevo mensaje' 
  })
  @IsString({ message: 'El mensaje debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El mensaje es requerido' })
  message: string;

  @ApiProperty({ 
    description: 'Si la notificación ha sido leída', 
    example: false,
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean({ message: 'is_read debe ser un booleano' })
  is_read?: boolean;

  @ApiProperty({ 
    description: 'ID del trabajo relacionado', 
    example: 1,
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsInt({ message: 'El job_id debe ser un número entero' })
  job_id?: number | null;

  @ApiProperty({ 
    description: 'ID de la propuesta relacionada', 
    example: 1,
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsInt({ message: 'El proposal_id debe ser un número entero' })
  proposal_id?: number | null;

  @ApiProperty({ 
    description: 'Datos adicionales en JSON', 
    example: { chat_id: 1, message_id: 123 },
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsObject({ message: 'metadata debe ser un objeto' })
  metadata?: any;
}
