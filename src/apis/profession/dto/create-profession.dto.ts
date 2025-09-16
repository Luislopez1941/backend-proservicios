import { IsString, IsNotEmpty } from 'class-validator';

export class CreateProfessionDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;
}
