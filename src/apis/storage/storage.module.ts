import { Module } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';
import { StorageController } from './storage.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [StorageController],
  providers: [SupabaseStorageService],
  exports: [SupabaseStorageService],
})
export class StorageModule {}