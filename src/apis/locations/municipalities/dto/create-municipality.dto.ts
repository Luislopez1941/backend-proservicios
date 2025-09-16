import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateMunicipalityDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @IsInt({ message: 'El ID del estado debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID del estado es requerido' })
  id_state: number;

  @IsString({ message: 'El tipo debe ser una cadena de texto' })
  @IsOptional()
  type?: string = 'municipality';
}
