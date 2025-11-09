import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { SupabaseService } from './supabase.service';
import { SocketController } from './socket.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [JwtModule, PrismaModule, NotificationModule],
  controllers: [SocketController],
  providers: [SocketGateway, SocketService, SupabaseService],
  exports: [SocketService, SupabaseService, SocketGateway],
})
export class SocketModule {}
