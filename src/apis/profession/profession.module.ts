import { Module } from '@nestjs/common';
import { ProfessionService } from './profession.service';
import { ProfessionController } from './profession.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProfessionController],
  providers: [ProfessionService],
  exports: [ProfessionService],
})
export class ProfessionModule {}
