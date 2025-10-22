import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReviewUserService } from './review-user.service';
import { CreateReviewUserDto } from './dto/create-review-user.dto';
import { UpdateReviewUserDto } from './dto/update-review-user.dto';

@Controller('review')
export class ReviewUserController {
  constructor(private readonly reviewUserService: ReviewUserService) {}

  @Post('create')
  create(@Body() createReviewUserDto: CreateReviewUserDto) {
    return this.reviewUserService.create(createReviewUserDto);
  }

  @Get()
  findAll() {
    return this.reviewUserService.findAll();
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.reviewUserService.findByUserId(+userId);
  }

  @Get('with-proposals')
  findReviewsWithProposals() {
    return this.reviewUserService.findReviewsWithProposals();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewUserService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReviewUserDto: UpdateReviewUserDto) {
    return this.reviewUserService.update(+id, updateReviewUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewUserService.remove(+id);
  }
}
