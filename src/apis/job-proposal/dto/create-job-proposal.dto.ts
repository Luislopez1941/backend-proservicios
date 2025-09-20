import { IsInt, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export class CreateJobProposalDto {
  @IsInt({ message: 'El user_id debe ser un número entero' })
  user_id: number;

  @IsInt({ message: 'El issuer_id debe ser un número entero' })
  issuer_id: number;

  @IsInt({ message: 'El receiver_id debe ser un número entero' })
  receiver_id: number;

  @IsString({ message: 'El título debe ser un string' })
  title: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un string' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'Las imágenes deben ser un array' })
  @IsString({ each: true, message: 'Cada imagen debe ser un string base64' })
  images?: string[];

  @IsOptional()
  @IsEnum(['active', 'canceled', 'accepted'], { 
    message: 'El estado debe ser: active, canceled, o accepted' 
  })
  status?: 'active' | 'canceled' | 'accepted';

  // Campos opcionales que el frontend puede enviar pero que ignoramos
  @IsOptional()
  @IsString()
  type_message?: string;

  @IsOptional()
  @IsString()
  last_message_sender?: string;

  @IsOptional()
  @IsString()
  message_status?: string;
}
