import { IsNotEmpty, IsInt, IsDateString, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ 
    description: 'ID del usuario que hace la reservación (cliente)', 
    example: 1 
  })
  @IsInt({ message: 'El issuer_id debe ser un número entero' })
  @IsNotEmpty({ message: 'El issuer_id es requerido' })
  issuer_id: number;

  @ApiProperty({ 
    description: 'ID del usuario que recibe la reservación (trabajador)', 
    example: 2 
  })
  @IsInt({ message: 'El receiver_id debe ser un número entero' })
  @IsNotEmpty({ message: 'El receiver_id es requerido' })
  receiver_id: number;

  @ApiProperty({ 
    description: 'Fecha de la reservación', 
    example: '2024-11-15T00:00:00.000Z' 
  })
  @IsDateString({}, { message: 'La fecha debe ser una fecha válida' })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  date: string;

  @ApiProperty({ 
    description: 'Hora de inicio de la reservación', 
    example: '09:00' 
  })
  @IsString({ message: 'La hora de inicio debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La hora de inicio es requerida' })
  @MinLength(5, { message: 'La hora de inicio debe tener el formato HH:MM' })
  @MaxLength(5, { message: 'La hora de inicio debe tener el formato HH:MM' })
  start_time: string;

  @ApiProperty({ 
    description: 'Hora de fin de la reservación', 
    example: '10:00' 
  })
  @IsString({ message: 'La hora de fin debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La hora de fin es requerida' })
  @MinLength(5, { message: 'La hora de fin debe tener el formato HH:MM' })
  @MaxLength(5, { message: 'La hora de fin debe tener el formato HH:MM' })
  end_time: string;

  @ApiProperty({ 
    description: 'Notas adicionales de la reservación', 
    example: 'Por favor llegar 10 minutos antes',
    required: false 
  })
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @IsOptional()
  notes?: string;
}
