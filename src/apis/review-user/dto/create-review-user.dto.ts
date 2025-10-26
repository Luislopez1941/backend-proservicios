import { IsInt, IsString, IsOptional, Min, Max, IsNotEmpty, IsObject, ValidateIf } from 'class-validator';

export class CreateReviewUserDto {
  @ValidateIf((o) => o.proposalId !== undefined)
  @IsInt()
  @IsOptional()
  proposalId?: number; // ID de la propuesta

  @ValidateIf((o) => o.proposal_id !== undefined)
  @IsInt()
  @IsOptional()
  proposal_id?: number; // ID de la propuesta (alternativo)

  @ValidateIf((o) => o.reviewer_id !== undefined && o.reviewer_id !== null)
  @IsInt()
  @IsOptional()
  reviewer_id?: number; // Usuario que da la reseña (opcional)

  @ValidateIf((o) => o.receiver_id !== undefined && o.receiver_id !== null)
  @IsInt()
  @IsOptional()
  receiver_id?: number; // Usuario que recibe la reseña (opcional)

  @ValidateIf((o) => o.user_review_id !== undefined && o.user_review_id !== null)
  @IsInt()
  @IsOptional()
  user_review_id?: number; // Usuario que está siendo calificado

  @IsObject()
  @IsNotEmpty()
  data: {
    comment?: string; // Comentario opcional
    job_id?: number; // ID del trabajo relacionado (opcional)
    user_id?: number; // ID del usuario (opcional, para compatibilidad)
  };
}
