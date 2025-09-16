import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsBoolean } from 'class-validator';
import { MessageType } from '@prisma/client';

export class CreateMessageDto {
  @IsInt({ message: 'El ID del emisor debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID del emisor es requerido' })
  issuer_id: number;

  @IsInt({ message: 'El ID del receptor debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID del receptor es requerido' })
  receiver_id: number;

  @IsInt({ message: 'El ID del chat debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID del chat es requerido' })
  chat_id: number;

  @IsString({ message: 'El mensaje debe ser una cadena de texto' })
  @IsOptional()
  message?: string;

  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsOptional()
  title?: string;

  @IsEnum(MessageType, { message: 'El tipo de mensaje debe ser normal o proposal' })
  @IsNotEmpty({ message: 'El tipo de mensaje es requerido' })
  type_message: MessageType;

  @IsInt({ message: 'El conteo de no leídos debe ser un número entero' })
  @IsOptional()
  unread_count?: number = 0;

  @IsString({ message: 'El último remitente debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El último remitente es requerido' })
  last_message_sender: string;

  @IsString({ message: 'El estado del mensaje debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El estado del mensaje es requerido' })
  message_status: string;

  @IsBoolean({ message: 'El estado en línea debe ser un booleano' })
  @IsOptional()
  is_online?: boolean = true;
}
