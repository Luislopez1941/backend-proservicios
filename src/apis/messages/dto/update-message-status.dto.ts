import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

export class UpdateMessageStatusDto {
  @IsEnum(MessageStatus, { message: 'El estado del mensaje debe ser: sent, delivered, read, o failed' })
  @IsOptional()
  message_status?: MessageStatus;

  @IsString({ message: 'El estado de la propuesta debe ser una cadena de texto' })
  @IsOptional()
  proposal_status?: string;
}
