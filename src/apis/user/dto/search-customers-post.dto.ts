import { IsOptional, IsInt, IsObject, ValidateNested, Min, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationInfoDto {
  @IsString({ message: 'El place_id debe ser un string' })
  place_id: string;

  @IsString({ message: 'La descripción debe ser un string' })
  description: string;

  @IsString({ message: 'El main_text debe ser un string' })
  main_text: string;

  @IsString({ message: 'El secondary_text debe ser un string' })
  secondary_text: string;

  @IsArray({ message: 'Los tipos deben ser un array' })
  @IsString({ each: true, message: 'Cada tipo debe ser un string' })
  types: string[];
}

export class SearchCustomersPostDto {
  @IsString({ message: 'El tipo debe ser un string' })
  type: string;

  @IsOptional()
  @IsInt({ message: 'El tipo de servicio debe ser un número entero' })
  @Type(() => Number)
  type_service?: number;

  @IsOptional()
  @IsObject({ message: 'La ubicación debe ser un objeto' })
  @ValidateNested()
  @Type(() => LocationInfoDto)
  type_location?: LocationInfoDto;

  @IsOptional()
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor a 0' })
  page?: number = 1;
}
