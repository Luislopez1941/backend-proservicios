import { Test, TestingModule } from '@nestjs/testing';
import { ReviewUserService } from './review-user.service';

describe('ReviewUserService', () => {
  let service: ReviewUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewUserService],
    }).compile();

    service = module.get<ReviewUserService>(ReviewUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
