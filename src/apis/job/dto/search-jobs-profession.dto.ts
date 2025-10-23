import { IsOptional, IsArray, IsString, IsNumber, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ProfessionSearchDto {
  @IsOptional()
  @IsNumber({}, { message: 'El ID debe ser un número' })
  @Type(() => Number)
  id?: number;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser un string' })
  name?: string;
}

export class SearchJobsByProfessionDto {
  @IsOptional()
  @IsArray({ message: 'Las profesiones deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => ProfessionSearchDto)
  professions?: ProfessionSearchDto[];

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
