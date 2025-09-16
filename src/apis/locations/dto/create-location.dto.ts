import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateLocationDto {
  @IsInt({ message: 'El ID de ubicación debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID de ubicación es requerido' })
  id_location: number;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @IsString({ message: 'El tipo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El tipo es requerido' })
  type: string;
}
