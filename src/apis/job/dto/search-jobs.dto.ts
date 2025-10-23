import { IsOptional, IsString, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

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
