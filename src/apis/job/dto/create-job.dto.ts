import { IsInt, IsString, IsOptional, IsEnum, IsArray, IsNumber, IsObject, Min, Max } from 'class-validator';

export class CreateJobDto {
  @IsInt({ message: 'El id_user debe ser un número entero' })
  id_user: number;

  @IsString({ message: 'El título debe ser un string' })
  title: string;

  @IsString({ message: 'La descripción debe ser un string' })
  description: string;

  @IsString({ message: 'La categoría debe ser un string' })
  category: string;

  @IsObject({ message: 'El presupuesto debe ser un objeto' })
  budget: any;

  @IsString({ message: 'La ubicación debe ser un string' })
  location: string;

  @IsOptional()
  @IsEnum(['normal', 'urgent'], { message: 'La urgencia debe ser normal o urgent' })
  urgency?: 'normal' | 'urgent';

  @IsOptional()
  @IsEnum(['open', 'in_progress', 'completed', 'cancelled'], { message: 'El estado debe ser uno de los valores válidos' })
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled';

  @IsObject({ message: 'Las profesiones deben ser un objeto' })
  professions: any;

  @IsOptional()
  @IsArray({ message: 'Las imágenes deben ser un array' })
  images?: any[];

  @IsString({ message: 'El precio debe ser un string' })
  price: string;

  @IsOptional()
  @IsInt({ message: 'El conteo de propuestas debe ser un número entero' })
  @Min(0, { message: 'El conteo de propuestas no puede ser negativo' })
  proposalsCount?: number;

  @IsOptional()
  @IsInt({ message: 'El conteo de vistas debe ser un número entero' })
  @Min(0, { message: 'El conteo de vistas no puede ser negativo' })
  viewsCount?: number;

  @IsOptional()
  @IsObject({ message: 'Los requisitos deben ser un objeto' })
  requirements?: any;

  @IsOptional()
  @IsString({ message: 'La línea de tiempo debe ser un string' })
  timeline?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de trabajo debe ser un string' })
  workType?: string;

  // Google Maps Location Data
  @IsOptional()
  @IsString({ message: 'La dirección debe ser un string' })
  location_address?: string;

  @IsOptional()
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @Min(-90, { message: 'La latitud debe estar entre -90 y 90' })
  @Max(90, { message: 'La latitud debe estar entre -90 y 90' })
  location_lat?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @Min(-180, { message: 'La longitud debe estar entre -180 y 180' })
  @Max(180, { message: 'La longitud debe estar entre -180 y 180' })
  location_lng?: number;

  @IsOptional()
  @IsString({ message: 'El place_id debe ser un string' })
  location_place_id?: string;

  @IsOptional()
  @IsObject({ message: 'Los límites deben ser un objeto' })
  location_bounds?: any;

  // Structured Location Data
  @IsOptional()
  @IsString({ message: 'La calle debe ser un string' })
  location_street?: string;

  @IsOptional()
  @IsString({ message: 'La colonia debe ser un string' })
  location_colony?: string;

  @IsOptional()
  @IsString({ message: 'La ciudad debe ser un string' })
  location_city?: string;

  @IsOptional()
  @IsString({ message: 'El estado debe ser un string' })
  location_state?: string;

  @IsOptional()
  @IsString({ message: 'El código postal debe ser un string' })
  location_postal_code?: string;

  @IsOptional()
  @IsString({ message: 'El país debe ser un string' })
  location_country?: string;
}
