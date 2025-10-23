import { IsOptional, IsString, IsNumber, IsObject, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationSearchDto {
  @IsOptional()
  @IsString({ message: 'La dirección debe ser un string' })
  location_address?: string;

  @IsOptional()
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @Min(-90, { message: 'La latitud debe estar entre -90 y 90' })
  @Max(90, { message: 'La latitud debe estar entre -90 y 90' })
  @Type(() => Number)
  location_lat?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @Min(-180, { message: 'La longitud debe estar entre -180 y 180' })
  @Max(180, { message: 'La longitud debe estar entre -180 y 180' })
  @Type(() => Number)
  location_lng?: number;

  @IsOptional()
  @IsString({ message: 'El place_id debe ser un string' })
  location_place_id?: string;

  @IsOptional()
  @IsString({ message: 'La ciudad debe ser un string' })
  location_city?: string;

  @IsOptional()
  @IsString({ message: 'El estado debe ser un string' })
  location_state?: string;

  @IsOptional()
  @IsString({ message: 'El país debe ser un string' })
  location_country?: string;

  @IsOptional()
  @IsString({ message: 'El código postal debe ser un string' })
  location_postal_code?: string;
}

export class SearchJobsByLocationDto {
  @IsOptional()
  @IsObject({ message: 'La ubicación debe ser un objeto' })
  @ValidateNested()
  @Type(() => LocationSearchDto)
  location?: LocationSearchDto;

  @IsOptional()
  @IsString({ message: 'La categoría debe ser un string' })
  category?: string;

  @IsOptional()
  @IsString({ message: 'La urgencia debe ser un string' })
  urgency?: 'normal' | 'urgent';

  @IsOptional()
  @IsString({ message: 'El estado debe ser un string' })
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled';

  @IsOptional()
  @IsNumber({}, { message: 'La página debe ser un número' })
  @Min(1, { message: 'La página debe ser mayor a 0' })
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @Min(1, { message: 'El límite debe ser mayor a 0' })
  @Type(() => Number)
  limit?: number = 10;
}
