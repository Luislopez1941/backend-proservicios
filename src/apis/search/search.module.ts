import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { GoogleMapsModule } from '../google-maps/google-maps.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [GoogleMapsModule, PrismaModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
