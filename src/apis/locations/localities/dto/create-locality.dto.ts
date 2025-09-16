import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateLocalityDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @IsInt({ message: 'El ID del estado debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID del estado es requerido' })
  id_state: number;

  @IsInt({ message: 'El ID del municipio debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID del municipio es requerido' })
  id_municipality: number;

  @IsString({ message: 'El tipo debe ser una cadena de texto' })
  @IsOptional()
  type?: string = 'locality';
}
