import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  // Configurar límite de tamaño del payload (10MB)
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Habilitar CORS
  app.enableCors();

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('ProServicios API')
    .setDescription('API para el sistema de servicios profesionales')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Configurar Swagger UI como alternativa
  SwaggerModule.setup('swagger', app, document);

  // Servir el JSON de Swagger para Scalar
  app.use('/swagger-json', (req: Request, res: Response) => {
    res.json(document);
  });

  // Configurar Scalar con la documentación generada automáticamente
  app.use('/docs', apiReference({ 
    spec: {
      url: '/swagger-json'
    },
    theme: 'purple',
    layout: 'modern',
    configuration: {
      theme: 'purple',
      layout: 'modern',
      showSidebar: true,
      hideDownloadButton: false,
      hideSearch: false,
      hideInfo: false,
      hideServers: false,
      hideModels: false,
      hideFooter: false,
      hideThemeToggle: false,
      hideSpecUrl: false,
      hideDefaultLanguage: false,
      hideTryIt: false,
      hideAuthentication: false,
      hideCurl: false
    }
  }));


  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Aplicación ejecutándose en: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 Documentación Scalar (raíz): http://localhost:${process.env.PORT ?? 3000}/`);
  console.log(`📚 Documentación Scalar (directa): http://localhost:${process.env.PORT ?? 3000}/docs`);
  console.log(`📖 Documentación Swagger: http://localhost:${process.env.PORT ?? 3000}/swagger`);
}
bootstrap();
