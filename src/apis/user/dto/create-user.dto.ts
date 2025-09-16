import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum, IsInt, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { UserType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  first_name: string;

  @IsString({ message: 'El segundo nombre debe ser una cadena de texto' })
  @IsOptional()
  second_name?: string;

  @IsString({ message: 'El primer apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El primer apellido es requerido' })
  first_surname: string;

  @IsString({ message: 'El segundo apellido debe ser una cadena de texto' })
  @IsOptional()
  second_last_name?: string;

  @IsString({ message: 'El país debe ser una cadena de texto' })
  @IsOptional()
  country?: string;

  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString({ message: 'La foto de perfil debe ser una cadena de texto' })
  @IsOptional()
  profilePhoto?: string;

  @IsString({ message: 'El fondo debe ser una cadena de texto' })
  @IsOptional()
  background?: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  phone: string;

  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  description?: string;

  @IsString({ message: 'El género debe ser una cadena de texto' })
  @IsOptional()
  gender?: string;

  @IsEnum(UserType, { message: 'El tipo de usuario debe ser client o worker' })
  @IsOptional()
  type_user?: UserType;

  @IsInt({ message: 'El ID del estado debe ser un número entero' })
  @IsOptional()
  id_state?: number;

  @IsInt({ message: 'El ID del municipio debe ser un número entero' })
  @IsOptional()
  id_municipality?: number;

  @IsInt({ message: 'El ID de la localidad debe ser un número entero' })
  @IsOptional()
  id_locality?: number;

  @IsArray({ message: 'Las profesiones deben ser un array' })
  @IsOptional()
  professions?: any[];

  @IsBoolean({ message: 'Los términos y condiciones deben ser un booleano' })
  @IsOptional()
  acceptTerms?: boolean;
}