import { Module } from '@nestjs/common';
import { MunicipalitiesService } from './municipalities.service';
import { MunicipalitiesController } from './municipalities.controller';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MunicipalitiesController],
  providers: [MunicipalitiesService],
  exports: [MunicipalitiesService],
})
export class MunicipalitiesModule {}
