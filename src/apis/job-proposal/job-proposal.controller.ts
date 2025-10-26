import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { JobProposalService } from './job-proposal.service';
import { CreateJobProposalDto } from './dto/create-job-proposal.dto';
import { UpdateJobProposalDto } from './dto/update-job-proposal.dto';

@Controller('job-proposal')
export class JobProposalController {
  constructor(private readonly jobProposalService: JobProposalService) {}

  @Post('create')
  create(@Body() createJobProposalDto: CreateJobProposalDto) {
    return this.jobProposalService.create(createJobProposalDto);
  }

  @Get()
  findAll() {
    return this.jobProposalService.findAll();
  }

  @Get('user/:userId')
  getUserProposals(@Param('userId') userId: string) {
    return this.jobProposalService.getUserProposals(+userId);
  }

  @Get('proposal-confirmed_payment/:userId')
  getProposalConfirmedPayment(@Param('userId') userId: string) {
    return this.jobProposalService.getProposalsByConfirmedPayment(+userId);
  }


  @Put(':id/status')
  updateProposalStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.jobProposalService.updateProposalStatus(+id, body.status);
  }

  @Put(':id/rating-status')
  updateRatingStatus(@Param('id') id: string, @Body() body: { rating: number, raterId: number, ratedUserId: number }) {
    console.log(`🔄 Rating Status Update - ID: ${id}, Rating: ${body.rating}, RaterId: ${body.raterId}, RatedUserId: ${body.ratedUserId}`);
    return this.jobProposalService.updateProposalStatus(+id, 'rating_status', body.rating, body.raterId, body.ratedUserId);
  }

  @Put(':id/review-status')
  updateReviewStatus(@Param('id') id: string) {
    return this.jobProposalService.updateReviewStatus(+id);
  }


  @Post(':id/images')
  uploadImages(@Param('id') id: string, @Body() body: { images: string[] }) {
    return this.jobProposalService.uploadImages(+id, body.images);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobProposalService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJobProposalDto: UpdateJobProposalDto) {
    return this.jobProposalService.update(+id, updateJobProposalDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobProposalService.remove(+id);
  }
}
