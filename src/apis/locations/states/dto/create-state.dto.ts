import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateStateDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @IsString({ message: 'El tipo debe ser una cadena de texto' })
  @IsOptional()
  type?: string = 'state';
}
