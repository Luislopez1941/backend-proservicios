import { IsInt, IsString, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateReviewUserDto {
  @IsInt()
  @IsNotEmpty()
  reviewer_id: number; // Usuario que da la reseña

  @IsInt()
  @IsNotEmpty()
  reviewed_id: number; // Usuario que recibe la reseña

  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number; // Calificación de 1 a 5

  @IsString()
  @IsOptional()
  comment?: string; // Comentario opcional

  @IsInt()
  @IsOptional()
  job_id?: number; // ID del trabajo relacionado (opcional)
}
