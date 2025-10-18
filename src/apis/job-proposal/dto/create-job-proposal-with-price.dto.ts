import { IsOptional, IsInt, IsString, IsArray, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PriceInfoDto {
  @ApiProperty({ 
    description: 'Precio total en centavos (ej: 150000 = $1500.00)', 
    example: 150000,
    required: false 
  })
  @IsOptional()
  @IsInt({ message: 'El precio total debe ser un número entero' })
  @Min(0, { message: 'El precio total no puede ser negativo' })
  price_total?: number;

  @ApiProperty({ 
    description: 'Código de moneda (MXN, USD, EUR, etc.)', 
    example: 'MXN',
    required: false 
  })
  @IsOptional()
  @IsString({ message: 'La moneda debe ser una cadena de texto' })
  currency?: string;

  @ApiProperty({ 
    description: 'Métodos de pago aceptados', 
    example: ['cash', 'card', 'transfer', 'crypto'],
    required: false 
  })
  @IsOptional()
  @IsArray({ message: 'Los métodos de pago deben ser un array' })
  @IsString({ each: true, message: 'Cada método de pago debe ser una cadena de texto' })
  accepts_payment_methods?: string[];
}

export class CreateJobProposalWithPriceDto {
  @ApiProperty({ 
    description: 'ID del mensaje asociado', 
    example: 1 
  })
  @IsInt({ message: 'El ID del mensaje debe ser un número entero' })
  message_id: number;

  @ApiProperty({ 
    description: 'ID del usuario que hace la propuesta', 
    example: 1 
  })
  @IsInt({ message: 'El ID del usuario debe ser un número entero' })
  user_id: number;

  @ApiProperty({ 
    description: 'ID del usuario que emite la propuesta', 
    example: 1 
  })
  @IsInt({ message: 'El ID del emisor debe ser un número entero' })
  issuer_id: number;

  @ApiProperty({ 
    description: 'ID del usuario que recibe la propuesta', 
    example: 2 
  })
  @IsInt({ message: 'El ID del receptor debe ser un número entero' })
  receiver_id: number;

  @ApiProperty({ 
    description: 'Título de la propuesta', 
    example: 'Reparación de plomería en baño' 
  })
  @IsString({ message: 'El título debe ser una cadena de texto' })
  title: string;

  @ApiProperty({ 
    description: 'Descripción detallada de la propuesta', 
    example: 'Repararé la fuga en el grifo del baño principal',
    required: false 
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description?: string;

  @ApiProperty({ 
    description: 'Imágenes de la propuesta', 
    example: ['base64_image1', 'base64_image2'],
    required: false 
  })
  @IsOptional()
  @IsArray({ message: 'Las imágenes deben ser un array' })
  images?: string[];

  @ApiProperty({ 
    description: 'Información de precios y moneda', 
    type: PriceInfoDto,
    required: false 
  })
  @IsOptional()
  price_info?: PriceInfoDto;
}
