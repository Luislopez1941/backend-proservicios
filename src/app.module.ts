import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './apis/auth/auth.module';
import { UserModule } from './apis/user/user.module';
import { ProfessionModule } from './apis/profession/profession.module';
import { MessagesModule } from './apis/messages/messages.module';
import { LocationsModule } from './apis/locations/locations.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule, 
    UserModule, 
    ProfessionModule, 
    MessagesModule, 
    LocationsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
