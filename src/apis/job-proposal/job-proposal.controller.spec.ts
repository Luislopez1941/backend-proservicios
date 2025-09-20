import { Test, TestingModule } from '@nestjs/testing';
import { JobProposalController } from './job-proposal.controller';
import { JobProposalService } from './job-proposal.service';

describe('JobProposalController', () => {
  let controller: JobProposalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobProposalController],
      providers: [JobProposalService],
    }).compile();

    controller = module.get<JobProposalController>(JobProposalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
