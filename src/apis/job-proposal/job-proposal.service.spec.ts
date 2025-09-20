import { Test, TestingModule } from '@nestjs/testing';
import { JobProposalService } from './job-proposal.service';

describe('JobProposalService', () => {
  let service: JobProposalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobProposalService],
    }).compile();

    service = module.get<JobProposalService>(JobProposalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
