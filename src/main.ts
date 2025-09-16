import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Habilitar CORS
  app.enableCors();
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Aplicación ejecutándose en: http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
