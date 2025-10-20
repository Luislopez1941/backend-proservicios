import { PartialType } from '@nestjs/swagger';
import { CreateReviewUserDto } from './create-review-user.dto';

export class UpdateReviewUserDto extends PartialType(CreateReviewUserDto) {}
