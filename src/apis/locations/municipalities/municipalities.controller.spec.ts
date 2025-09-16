import { Test, TestingModule } from '@nestjs/testing';
import { MunicipalitiesController } from './municipalities.controller';
import { MunicipalitiesService } from './municipalities.service';

describe('MunicipalitiesController', () => {
  let controller: MunicipalitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MunicipalitiesController],
      providers: [MunicipalitiesService],
    }).compile();

    controller = module.get<MunicipalitiesController>(MunicipalitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
