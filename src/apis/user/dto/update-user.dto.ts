import { IsOptional, IsString, IsArray, ValidateNested, IsEmail, MinLength, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export class ImageUpdateDto {
  @ApiProperty({ 
    description: 'Imagen en formato base64 (data:image/jpeg;base64,...)', 
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
    required: false
  })
  @IsString({ message: 'La imagen debe ser una cadena base64 válida' })
  @IsOptional()
  base64?: string;

  @ApiProperty({ 
    description: 'URL de la imagen (si ya está subida)', 
    example: 'https://supabase.com/storage/v1/object/public/user-images/profile-123.jpg',
    required: false
  })
  @IsString({ message: 'La URL debe ser una cadena válida' })
  @IsOptional()
  url?: string;
}

export class UpdateUserDto {
  @ApiProperty({ 
    description: 'ID del usuario (ignorado en actualización)', 
    example: 1,
    required: false
  })
  @IsOptional()
  id?: number;

  @ApiProperty({ 
    description: 'Tipo de usuario (ignorado en actualización)', 
    example: 'worker',
    required: false
  })
  @IsOptional()
  type?: string;

  @ApiProperty({ 
    description: 'Profesiones del usuario', 
    example: ['Electricista', 'Plomero'],
    required: false
  })
  @IsArray({ message: 'Las profesiones deben ser un array' })
  @IsString({ each: true, message: 'Cada profesión debe ser una cadena de texto' })
  @IsOptional()
  professions?: string[];

  @ApiProperty({ 
    description: 'Nombre del usuario', 
    example: 'Juan',
    required: false
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsOptional()
  first_name?: string;

  @ApiProperty({ 
    description: 'Segundo nombre del usuario', 
    example: 'Carlos',
    required: false
  })
  @IsString({ message: 'El segundo nombre debe ser una cadena de texto' })
  @IsOptional()
  second_name?: string;

  @ApiProperty({ 
    description: 'Apellido paterno del usuario', 
    example: 'García',
    required: false
  })
  @IsString({ message: 'El apellido paterno debe ser una cadena de texto' })
  @IsOptional()
  first_surname?: string;

  @ApiProperty({ 
    description: 'Apellido materno del usuario', 
    example: 'López',
    required: false
  })
  @IsString({ message: 'El apellido materno debe ser una cadena de texto' })
  @IsOptional()
  second_last_name?: string;

  @ApiProperty({ 
    description: 'Correo electrónico del usuario', 
    example: 'usuario@ejemplo.com',
    required: false
  })
  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido' })
  @IsOptional()
  email?: string;

  @ApiProperty({ 
    description: 'Contraseña del usuario', 
    example: 'contraseña123',
    required: false
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsOptional()
  password?: string;

  @ApiProperty({ 
    description: 'Número de teléfono del usuario', 
    example: '+52 55 1234 5678',
    required: false
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsOptional()
  phone?: string;

  @ApiProperty({ 
    description: 'Descripción del usuario', 
    example: 'Profesional con 5 años de experiencia',
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
    example: 'worker',
    required: false
  })
  @IsEnum(UserType, { message: 'El tipo de usuario debe ser válido' })
  @IsOptional()
  type_user?: UserType;

  @ApiProperty({ 
    description: 'Si el usuario está verificado', 
    example: true,
    required: false
  })
  @IsBoolean({ message: 'El estado de verificación debe ser un booleano' })
  @IsOptional()
  verified?: boolean;

  @ApiProperty({ 
    description: 'Foto de perfil en base64 o URL', 
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
    required: false
  })
  @IsString({ message: 'La foto de perfil debe ser una cadena base64 válida' })
  @IsOptional()
  profilePhoto?: string;

  @ApiProperty({ 
    description: 'Imagen de fondo en base64 o URL', 
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
    required: false
  })
  @IsString({ message: 'La imagen de fondo debe ser una cadena base64 válida' })
  @IsOptional()
  background?: string;

  @ApiProperty({ 
    description: 'Fotos de trabajos en base64 o URLs', 
    example: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...'],
    required: false
  })
  @IsArray({ message: 'Las fotos de trabajo deben ser un array' })
  @IsString({ each: true, message: 'Cada foto de trabajo debe ser una cadena base64 válida' })
  @IsOptional()
  workPhotos?: string[];
}