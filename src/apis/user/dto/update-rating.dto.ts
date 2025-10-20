import { IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export class UpdateRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;
}
