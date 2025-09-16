import { IsOptional, IsInt, IsObject, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDto {
  @IsInt({ message: 'El ID de ubicación debe ser un número entero' })
  id_location: number;

  @IsOptional()
  type?: string;
}

export class SearchCustomersDto {
  @IsOptional()
  @IsInt({ message: 'El tipo de servicio debe ser un número entero' })
  type_service?: number;

  @IsOptional()
  @IsObject({ message: 'La ubicación debe ser un objeto' })
  @ValidateNested()
  @Type(() => LocationDto)
  type_location?: LocationDto;

  @IsOptional()
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor a 0' })
  page?: number = 1;
}
