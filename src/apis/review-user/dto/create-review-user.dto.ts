import { IsInt, IsString, IsOptional, Min, Max, IsNotEmpty, IsObject, ValidateIf } from 'class-validator';

export class CreateReviewUserDto {
  @IsInt()
  @IsNotEmpty()
  proposalId: number; // ID de la propuesta

  @ValidateIf((o) => o.reviewer_id !== undefined && o.reviewer_id !== null)
  @IsInt()
  @IsOptional()
  reviewer_id?: number; // Usuario que da la reseña (opcional)

  @ValidateIf((o) => o.receiver_id !== undefined && o.receiver_id !== null)
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
