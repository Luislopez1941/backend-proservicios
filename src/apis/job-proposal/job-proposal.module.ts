import { Module } from '@nestjs/common';
import { JobProposalService } from './job-proposal.service';
import { JobProposalController } from './job-proposal.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, StorageModule, NotificationModule],
  controllers: [JobProposalController],
  providers: [JobProposalService],
  exports: [JobProposalService],
})
export class JobProposalModule {}
