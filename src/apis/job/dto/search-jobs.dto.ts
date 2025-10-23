import { IsOptional, IsString, IsNumber, IsArray, ValidateNested, Min, Max, IsObject } from 'class-validator';
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

export class SearchJobsDto {
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser un string' })
  searchTerm?: string;

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
  @IsString({ message: 'El tipo de trabajo debe ser un string' })
  workType?: 'Presencial' | 'Remoto' | 'Híbrido';

  @IsOptional()
  @IsNumber({}, { message: 'El precio mínimo debe ser un número' })
  @Min(0, { message: 'El precio mínimo debe ser mayor o igual a 0' })
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El precio máximo debe ser un número' })
  @Min(0, { message: 'El precio máximo debe ser mayor o igual a 0' })
  @Type(() => Number)
  maxPrice?: number;

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
