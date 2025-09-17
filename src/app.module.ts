import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './apis/auth/auth.module';
import { UserModule } from './apis/user/user.module';
import { ProfessionModule } from './apis/profession/profession.module';
import { MessagesModule } from './apis/messages/messages.module';
import { SearchModule } from './apis/search/search.module';
import { PrismaModule } from './prisma/prisma.module';
import { GoogleMapsModule } from './apis/google-maps/google-maps.module';
import { ValidationModule } from './apis/validation/validation.module';
import { StorageModule } from './apis/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule, 
    UserModule, 
    ProfessionModule, 
    MessagesModule,
    GoogleMapsModule,
    SearchModule,
    ValidationModule,
    StorageModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
