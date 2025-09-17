import { Test, TestingModule } from '@nestjs/testing';
import { GoogleMapsController } from './google-maps.controller';
import { GoogleMapsService } from './google-maps.service';

describe('GoogleMapsController', () => {
  let controller: GoogleMapsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleMapsController],
      providers: [GoogleMapsService],
    }).compile();

    controller = module.get<GoogleMapsController>(GoogleMapsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
