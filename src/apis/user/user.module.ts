import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { GoogleMapsModule } from '../google-maps/google-maps.module';
import { ValidationModule } from '../validation/validation.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, GoogleMapsModule, ValidationModule, StorageModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
