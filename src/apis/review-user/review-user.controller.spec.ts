import { Test, TestingModule } from '@nestjs/testing';
import { ReviewUserController } from './review-user.controller';
import { ReviewUserService } from './review-user.service';

describe('ReviewUserController', () => {
  let controller: ReviewUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewUserController],
      providers: [ReviewUserService],
    }).compile();

    controller = module.get<ReviewUserController>(ReviewUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
