import { IsInt, IsString, IsOptional, Min, Max, IsNotEmpty, IsObject } from 'class-validator';

export class CreateReviewUserDto {
  @IsInt()
  @IsNotEmpty()
  proposalId: number; // ID de la propuesta

  @IsInt()
  @IsOptional()
  reviewer_id?: number; // Usuario que da la reseña (opcional)

  @IsInt()
  @IsOptional()
  receiver_id?: number; // Usuario que recibe la reseña (opcional)

  @IsObject()
  @IsNotEmpty()
  data: {
    comment?: string; // Comentario opcional
    job_id?: number; // ID del trabajo relacionado (opcional)
  };
}
