import { Module } from '@nestjs/common';
import { ReviewUserService } from './review-user.service';
import { ReviewUserController } from './review-user.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewUserController],
  providers: [ReviewUserService],
})
export class ReviewUserModule {}
