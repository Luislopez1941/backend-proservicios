import { IsEnum, IsOptional, IsInt } from 'class-validator';

export class UpdateJobStatusDto {
  @IsEnum(['open', 'in_progress', 'completed', 'cancelled', 'accepted'], { 
    message: 'El estado debe ser uno de: open, in_progress, completed, cancelled, accepted' 
  })
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'accepted';

  @IsOptional()
  @IsInt({ message: 'El receiver_id debe ser un número entero' })
  receiver_id?: number;
}
