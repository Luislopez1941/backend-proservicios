import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum, IsBoolean, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { UserType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty({ 
    description: 'Dirección completa del usuario', 
    example: 'Av. Tulum 456, Centro, 77500 Cancún, Q.R., México' 
  })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La dirección es requerida' })
  address: string;

  @ApiProperty({ 
    description: 'Place ID de Google Maps (generado automáticamente por el backend)', 
    example: 'ChIJ8VQyqQqG1o8RqJzQzQzQzQzQ',
    required: false
  })
  @IsString({ message: 'El Place ID debe ser una cadena de texto' })
  @IsOptional()
  place_id?: string;

  @ApiProperty({ 
    description: 'Estado seleccionado por el usuario', 
    example: 'Quintana Roo',
    required: false
  })
  @IsString({ message: 'El estado debe ser una cadena de texto' })
  @IsOptional()
  estado?: string;

  @ApiProperty({ 
    description: 'Municipio/Ciudad seleccionado por el usuario', 
    example: 'Cancún',
    required: false
  })
  @IsString({ message: 'El municipio debe ser una cadena de texto' })
  @IsOptional()
  municipio?: string;

  @ApiProperty({ 
    description: 'Código postal ingresado por el usuario', 
    example: '77500',
    required: false
  })
  @IsString({ message: 'El código postal debe ser una cadena de texto' })
  @IsOptional()
  codigo_postal?: string;

  @ApiProperty({ 
    description: 'País de la ubicación del usuario', 
    example: 'México',
    required: false
  })
  @IsString({ message: 'El país debe ser una cadena de texto' })
  @IsOptional()
  pais?: string;
}

export class CreateUserDto {
  @ApiProperty({ 
    description: 'Nombre del usuario', 
    example: 'Juan' 
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  first_name: string;

  @ApiProperty({ 
    description: 'Segundo nombre del usuario', 
    example: 'Carlos', 
    required: false 
  })
  @IsString({ message: 'El segundo nombre debe ser una cadena de texto' })
  @IsOptional()
  second_name?: string;

  @ApiProperty({ 
    description: 'Primer apellido del usuario', 
    example: 'Pérez' 
  })
  @IsString({ message: 'El primer apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El primer apellido es requerido' })
  first_surname: string;

  @ApiProperty({ 
    description: 'Segundo apellido del usuario', 
    example: 'García', 
    required: false 
  })
  @IsString({ message: 'El segundo apellido debe ser una cadena de texto' })
  @IsOptional()
  second_last_name?: string;

  @ApiProperty({ 
    description: 'País del usuario', 
    example: 'México', 
    required: false 
  })
  @IsString({ message: 'El país debe ser una cadena de texto' })
  @IsOptional()
  country?: string;

  @ApiProperty({ 
    description: 'Email del usuario', 
    example: 'juan.perez@email.com' 
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({ 
    description: 'Contraseña del usuario', 
    example: 'miPassword123' 
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ 
    description: 'URL de la foto de perfil', 
    example: 'https://example.com/photo.jpg', 
    required: false 
  })
  @IsString({ message: 'La foto de perfil debe ser una cadena de texto' })
  @IsOptional()
  profilePhoto?: string;

  @ApiProperty({ 
    description: 'URL de la imagen de fondo', 
    example: 'https://example.com/background.jpg', 
    required: false 
  })
  @IsString({ message: 'El fondo debe ser una cadena de texto' })
  @IsOptional()
  background?: string;

  @ApiProperty({ 
    description: 'Número de teléfono del usuario', 
    example: '+52 55 1234 5678' 
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  phone: string;

  @ApiProperty({ 
    description: 'Descripción del usuario', 
    example: 'Soy un profesional con 5 años de experiencia', 
    required: false 
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    description: 'Género del usuario', 
    example: 'Masculino', 
    required: false 
  })
  @IsString({ message: 'El género debe ser una cadena de texto' })
  @IsOptional()
  gender?: string;

  @ApiProperty({ 
    description: 'Tipo de usuario', 
    enum: UserType, 
    example: UserType.client 
  })
  @IsEnum(UserType, { message: 'El tipo de usuario debe ser client o worker' })
  @IsOptional()
  type_user?: UserType;

  @ApiProperty({ 
    description: 'Información de ubicación del usuario', 
    type: LocationDto 
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty({ message: 'La ubicación es requerida' })
  location: LocationDto;

  @ApiProperty({ 
    description: 'Array de profesiones del usuario', 
    example: [{id: 3, name: "Electricista", category: "Técnico"}], 
    required: false 
  })
  @IsArray({ message: 'Las profesiones deben ser un array' })
  @IsOptional()
  professions?: any[];

  @ApiProperty({ 
    description: 'Si el usuario acepta términos y condiciones', 
    example: true, 
    required: false 
  })
  @IsBoolean({ message: 'Los términos y condiciones deben ser un booleano' })
  @IsOptional()
  acceptTerms?: boolean;

  @ApiProperty({ 
    description: 'Disponibilidad en calendario del usuario', 
    example: { monday: [{ start: '09:00', end: '17:00' }], tuesday: [{ start: '09:00', end: '17:00' }] },
    required: false 
  })
  @IsOptional()
  calendar_availability?: any;
}