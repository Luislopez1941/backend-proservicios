import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { LocalitiesModule } from './localities/localities.module';
import { MunicipalitiesModule } from './municipalities/municipalities.module';
import { StatesModule } from './states/states.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, LocalitiesModule, MunicipalitiesModule, StatesModule],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
