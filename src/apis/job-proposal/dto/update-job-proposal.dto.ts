import { PartialType } from '@nestjs/swagger';
import { CreateJobProposalDto } from './create-job-proposal.dto';

export class UpdateJobProposalDto extends PartialType(CreateJobProposalDto) {}
