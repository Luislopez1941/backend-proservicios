import { IsOptional, IsString, IsNumber, IsObject, ValidateNested, Min, Max, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationSearchDto {
  @IsOptional()
  @IsString({ message: 'La descripción debe ser un string' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'El main_text debe ser un string' })
  main_text?: string;

  @IsOptional()
  @IsString({ message: 'El secondary_text debe ser un string' })
  secondary_text?: string;

  @IsOptional()
  @IsString({ message: 'El place_id debe ser un string' })
  place_id?: string;

  @IsOptional()
  @IsArray({ message: 'Los tipos deben ser un array' })
  @IsString({ each: true, message: 'Cada tipo debe ser un string' })
  types?: string[];

  // Campos adicionales para búsqueda más específica
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

export class ProfessionSearchDto {
  @IsOptional()
  @IsNumber({}, { message: 'El ID debe ser un número' })
  @Type(() => Number)
  id?: number;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser un string' })
  name?: string;
}

export class SearchJobsByLocationDto {
  @IsOptional()
  @IsObject({ message: 'La ubicación debe ser un objeto' })
  @ValidateNested()
  @Type(() => LocationSearchDto)
  location?: LocationSearchDto;

  @IsOptional()
  @IsArray({ message: 'Las profesiones deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => ProfessionSearchDto)
  professions?: ProfessionSearchDto[];

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
