import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StructuredLocationDto {
  @ApiProperty({ 
    description: 'Calle y número de la dirección', 
    example: 'Av. Tulum 456', 
    required: false 
  })
  @IsString({ message: 'La calle debe ser una cadena de texto' })
  @IsOptional()
  street?: string;

  @ApiProperty({ 
    description: 'Colonia o barrio', 
    example: 'Centro', 
    required: false 
  })
  @IsString({ message: 'La colonia debe ser una cadena de texto' })
  @IsOptional()
  colony?: string;

  @ApiProperty({ 
    description: 'Ciudad o municipio', 
    example: 'Cancún', 
    required: false 
  })
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @IsOptional()
  city?: string;

  @ApiProperty({ 
    description: 'Estado o provincia', 
    example: 'Quintana Roo', 
    required: false 
  })
  @IsString({ message: 'El estado debe ser una cadena de texto' })
  @IsOptional()
  state?: string;

  @ApiProperty({ 
    description: 'Código postal', 
    example: '77500', 
    required: false 
  })
  @IsString({ message: 'El código postal debe ser una cadena de texto' })
  @IsOptional()
  postal_code?: string;

  @ApiProperty({ 
    description: 'País', 
    example: 'México', 
    required: false 
  })
  @IsString({ message: 'El país debe ser una cadena de texto' })
  @IsOptional()
  country?: string;

  @ApiProperty({ 
    description: 'Dirección completa (para compatibilidad)', 
    example: 'Av. Tulum 456, Centro, Cancún, Q.R., México', 
    required: false 
  })
  @IsString({ message: 'La dirección completa debe ser una cadena de texto' })
  @IsOptional()
  full_address?: string;

  @ApiProperty({ 
    description: 'Latitud de la ubicación', 
    example: 21.1619, 
    required: false 
  })
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @IsOptional()
  lat?: number;

  @ApiProperty({ 
    description: 'Longitud de la ubicación', 
    example: -86.8515, 
    required: false 
  })
  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @IsOptional()
  lng?: number;

  @ApiProperty({ 
    description: 'Place ID de Google Maps', 
    example: 'ChIJ8VQyqQqG1o8RqJzQzQzQzQzQ', 
    required: false 
  })
  @IsString({ message: 'El Place ID debe ser una cadena de texto' })
  @IsOptional()
  place_id?: string;
}
