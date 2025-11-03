import { 
  IsOptional, 
  IsString, 
  IsEmail, 
  IsBoolean, 
  IsArray, 
  IsNumber, 
  IsEnum, 
  IsDateString,
  MinLength,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export class CompleteUserDto {
  @ApiProperty({ 
    description: 'ID único del usuario', 
    example: 1,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'El ID debe ser un número' })
  id?: number;

  @ApiProperty({ 
    description: 'Nombre del usuario', 
    example: 'Juan' 
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
    description: 'Primer apellido del usuario', 
    example: 'Pérez' 
  })
  @IsString({ message: 'El primer apellido debe ser una cadena de texto' })
  @IsOptional()
  first_surname?: string;

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
  @IsOptional()
  email?: string;

  @ApiProperty({ 
    description: 'Contraseña del usuario', 
    example: 'miPassword123' 
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsOptional()
  password?: string;

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
    description: 'Fotos de trabajos realizados', 
    example: ['https://example.com/work1.jpg', 'https://example.com/work2.jpg'], 
    required: false 
  })
  @IsArray({ message: 'Las fotos de trabajo deben ser un array' })
  @IsOptional()
  workPhotos?: any[];

  @ApiProperty({ 
    description: 'Número de teléfono del usuario', 
    example: '+52 55 1234 5678' 
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsOptional()
  phone?: string;

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
    description: 'Profesiones del usuario', 
    example: [{id: 3, name: "Electricista", category: "Técnico"}], 
    required: false 
  })
  @IsArray({ message: 'Las profesiones deben ser un array' })
  @IsOptional()
  professions?: any[];

  @ApiProperty({ 
    description: 'Calificaciones/estrellas del usuario', 
    example: [5, 4, 5, 5], 
    required: false 
  })
  @IsArray({ message: 'Las estrellas deben ser un array' })
  @IsOptional()
  starts?: any[];

  @ApiProperty({ 
    description: 'Si el usuario está verificado', 
    example: true, 
    required: false 
  })
  @IsBoolean({ message: 'El estado de verificación debe ser un booleano' })
  @IsOptional()
  verified?: boolean;

  @ApiProperty({ 
    description: 'Disponibilidad en calendario del usuario', 
    example: { monday: [{ start: '09:00', end: '17:00' }], tuesday: [{ start: '09:00', end: '17:00' }] },
    required: false 
  })
  @IsOptional()
  calendar_availability?: any;

  @ApiProperty({ 
    description: 'Fecha de nacimiento del usuario', 
    example: '1990-05-15T00:00:00.000Z', 
    required: false 
  })
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida' })
  @IsOptional()
  birthdate?: Date;

  // Campos de trabajo completados
  @ApiProperty({ 
    description: 'Número de trabajos completados', 
    example: 25, 
    required: false 
  })
  @IsNumber({}, { message: 'Los trabajos completados deben ser un número' })
  @Min(0, { message: 'Los trabajos completados no pueden ser negativos' })
  @IsOptional()
  completed_works?: number;

  @ApiProperty({ 
    description: 'Número de trabajos pagados', 
    example: 20, 
    required: false 
  })
  @IsNumber({}, { message: 'Los trabajos pagados deben ser un número' })
  @Min(0, { message: 'Los trabajos pagados no pueden ser negativos' })
  @IsOptional()
  paid_jobs?: number;

  @ApiProperty({ 
    description: 'Número de trabajos finalizados', 
    example: 22, 
    required: false 
  })
  @IsNumber({}, { message: 'Los trabajos finalizados deben ser un número' })
  @Min(0, { message: 'Los trabajos finalizados no pueden ser negativos' })
  @IsOptional()
  finished_works?: number;

  // Campos de facturación
  @ApiProperty({ 
    description: 'Ingresos del mes actual', 
    example: 5000.50, 
    required: false 
  })
  @IsNumber({}, { message: 'Los ingresos del mes deben ser un número' })
  @Min(0, { message: 'Los ingresos no pueden ser negativos' })
  @IsOptional()
  income_month?: number;

  @ApiProperty({ 
    description: 'Ingresos del año actual', 
    example: 60000.75, 
    required: false 
  })
  @IsNumber({}, { message: 'Los ingresos del año deben ser un número' })
  @Min(0, { message: 'Los ingresos no pueden ser negativos' })
  @IsOptional()
  income_year?: number;

  @ApiProperty({ 
    description: 'Ingresos totales', 
    example: 120000.00, 
    required: false 
  })
  @IsNumber({}, { message: 'Los ingresos totales deben ser un número' })
  @Min(0, { message: 'Los ingresos no pueden ser negativos' })
  @IsOptional()
  income_total?: number;

  @ApiProperty({ 
    description: 'Ingresos del mes pasado', 
    example: 4500.25, 
    required: false 
  })
  @IsNumber({}, { message: 'Los ingresos del mes pasado deben ser un número' })
  @Min(0, { message: 'Los ingresos no pueden ser negativos' })
  @IsOptional()
  income_month_last?: number;

  @ApiProperty({ 
    description: 'Ingresos del año pasado', 
    example: 55000.00, 
    required: false 
  })
  @IsNumber({}, { message: 'Los ingresos del año pasado deben ser un número' })
  @Min(0, { message: 'Los ingresos no pueden ser negativos' })
  @IsOptional()
  income_year_last?: number;

  @ApiProperty({ 
    description: 'Ingresos totales del período pasado', 
    example: 110000.00, 
    required: false 
  })
  @IsNumber({}, { message: 'Los ingresos totales del período pasado deben ser un número' })
  @Min(0, { message: 'Los ingresos no pueden ser negativos' })
  @IsOptional()
  income_total_last?: number;

  @ApiProperty({ 
    description: 'Ingresos del mes del año pasado', 
    example: 4200.50, 
    required: false 
  })
  @IsNumber({}, { message: 'Los ingresos del mes del año pasado deben ser un número' })
  @Min(0, { message: 'Los ingresos no pueden ser negativos' })
  @IsOptional()
  income_month_last_year?: number;

  @ApiProperty({ 
    description: 'Ingresos del año pasado', 
    example: 50000.00, 
    required: false 
  })
  @IsNumber({}, { message: 'Los ingresos del año pasado deben ser un número' })
  @Min(0, { message: 'Los ingresos no pueden ser negativos' })
  @IsOptional()
  income_year_last_year?: number;

  @ApiProperty({ 
    description: 'Ingresos totales del año pasado', 
    example: 100000.00, 
    required: false 
  })
  @IsNumber({}, { message: 'Los ingresos totales del año pasado deben ser un número' })
  @Min(0, { message: 'Los ingresos no pueden ser negativos' })
  @IsOptional()
  income_total_last_year?: number;

  // Campos de rating
  @ApiProperty({ 
    description: 'Número de reseñas recibidas', 
    example: 15, 
    required: false 
  })
  @IsNumber({}, { message: 'El número de reseñas debe ser un número' })
  @Min(0, { message: 'El número de reseñas no puede ser negativo' })
  @IsOptional()
  reviewsCount?: number;

  @ApiProperty({ 
    description: 'Calificación promedio del usuario (1-5)', 
    example: 4.5, 
    required: false 
  })
  @IsNumber({}, { message: 'La calificación debe ser un número' })
  @Min(1, { message: 'La calificación mínima es 1' })
  @Max(5, { message: 'La calificación máxima es 5' })
  @IsOptional()
  rating?: number;

  @ApiProperty({ 
    description: 'DNI o documento de identidad', 
    example: '12345678', 
    required: false 
  })
  @IsString({ message: 'El DNI debe ser una cadena de texto' })
  @IsOptional()
  dni?: string;

  @ApiProperty({ 
    description: 'Tipo de usuario', 
    enum: UserType, 
    example: UserType.client 
  })
  @IsEnum(UserType, { message: 'El tipo de usuario debe ser client o worker' })
  @IsOptional()
  type_user?: UserType;

  // Campos de ubicación Google Maps (compatibilidad)
  @ApiProperty({ 
    description: 'Dirección completa de la ubicación', 
    example: 'Av. Tulum 456, Centro, Cancún, Q.R., México', 
    required: false 
  })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsOptional()
  location_address?: string;

  @ApiProperty({ 
    description: 'Latitud de la ubicación', 
    example: 21.1619, 
    required: false 
  })
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @IsOptional()
  location_lat?: number;

  @ApiProperty({ 
    description: 'Longitud de la ubicación', 
    example: -86.8515, 
    required: false 
  })
  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @IsOptional()
  location_lng?: number;

  @ApiProperty({ 
    description: 'Place ID de Google Maps', 
    example: 'ChIJ8VQyqQqG1o8RqJzQzQzQzQzQ', 
    required: false 
  })
  @IsString({ message: 'El Place ID debe ser una cadena de texto' })
  @IsOptional()
  location_place_id?: string;

  @ApiProperty({ 
    description: 'Límites geográficos de la ubicación', 
    example: {northeast: {lat: 21.2, lng: -86.8}, southwest: {lat: 21.1, lng: -86.9}}, 
    required: false 
  })
  @IsOptional()
  location_bounds?: any;

  // Campos de ubicación estructurada
  @ApiProperty({ 
    description: 'Calle y número de la dirección', 
    example: 'Av. Tulum 456', 
    required: false 
  })
  @IsString({ message: 'La calle debe ser una cadena de texto' })
  @IsOptional()
  location_street?: string;

  @ApiProperty({ 
    description: 'Colonia o barrio', 
    example: 'Centro', 
    required: false 
  })
  @IsString({ message: 'La colonia debe ser una cadena de texto' })
  @IsOptional()
  location_colony?: string;

  @ApiProperty({ 
    description: 'Ciudad o municipio', 
    example: 'Cancún', 
    required: false 
  })
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @IsOptional()
  location_city?: string;

  @ApiProperty({ 
    description: 'Estado o provincia', 
    example: 'Quintana Roo', 
    required: false 
  })
  @IsString({ message: 'El estado debe ser una cadena de texto' })
  @IsOptional()
  location_state?: string;

  @ApiProperty({ 
    description: 'Código postal', 
    example: '77500', 
    required: false 
  })
  @IsString({ message: 'El código postal debe ser una cadena de texto' })
  @IsOptional()
  location_postal_code?: string;

  @ApiProperty({ 
    description: 'País', 
    example: 'México', 
    required: false 
  })
  @IsString({ message: 'El país debe ser una cadena de texto' })
  @IsOptional()
  location_country?: string;
}
