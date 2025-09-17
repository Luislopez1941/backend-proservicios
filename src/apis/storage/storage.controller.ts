import { Controller, Post, Get, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SupabaseStorageService } from './supabase-storage.service';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: SupabaseStorageService) {}

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint', description: 'Endpoint de prueba para verificar que el módulo funciona' })
  async test() {
    return {
      status: 'success',
      message: 'Storage module is working',
      timestamp: new Date().toISOString()
    };
  }

  @Get('test-supabase')
  @ApiOperation({ summary: 'Test Supabase', description: 'Verifica la conexión con Supabase y lista buckets' })
  async testSupabase() {
    try {
      const buckets = await this.storageService.listBuckets();
      return {
        status: 'success',
        message: 'Conexión con Supabase exitosa',
        data: {
          buckets: buckets,
          bucketCount: buckets.length
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Error al conectar con Supabase: ${error.message}`
      };
    }
  }

  @Post('create-bucket')
  @ApiOperation({ 
    summary: 'Crear bucket de almacenamiento', 
    description: 'Crea un nuevo bucket en Supabase Storage' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bucketName: { type: 'string', example: 'user-images' },
        isPublic: { type: 'boolean', example: true }
      },
      required: ['bucketName']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Bucket creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Bucket creado exitosamente' },
        data: { type: 'object' }
      }
    }
  })
  async createBucket(@Body() body: { bucketName: string; isPublic?: boolean }) {
    try {
      const { bucketName, isPublic = true } = body;
      
      // Crear bucket usando la service key
      const result = await this.storageService.createBucketWithServiceKey(bucketName, isPublic);
      
      return {
        status: 'success',
        message: 'Bucket creado exitosamente',
        data: result
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Error al crear bucket: ${error.message}`
      };
    }
  }

  @Get('buckets')
  @ApiOperation({ 
    summary: 'Listar buckets', 
    description: 'Obtiene la lista de buckets disponibles' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de buckets obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Buckets obtenidos exitosamente' },
        data: { type: 'array', items: { type: 'object' } }
      }
    }
  })
  async listBuckets() {
    try {
      const buckets = await this.storageService.listBuckets();
      
      return {
        status: 'success',
        message: 'Buckets obtenidos exitosamente',
        data: buckets
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Error al obtener buckets: ${error.message}`
      };
    }
  }

  @Post('upload-test')
  @ApiOperation({ 
    summary: 'Subir imagen de prueba', 
    description: 'Sube una imagen de prueba para verificar que el storage funciona' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        base64Image: { 
          type: 'string', 
          example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...' 
        },
        fileName: { type: 'string', example: 'test-image' },
        bucket: { type: 'string', example: 'user-images' }
      },
      required: ['base64Image', 'fileName']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Imagen subida exitosamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Imagen subida exitosamente' },
        data: {
          type: 'object',
          properties: {
            url: { type: 'string', example: 'https://...' },
            fileName: { type: 'string', example: 'test-image.jpg' }
          }
        }
      }
    }
  })
  async uploadTestImage(@Body() body: { base64Image: string; fileName: string; bucket?: string }) {
    try {
      const { base64Image, fileName, bucket = 'user-images' } = body;
      
      const url = await this.storageService.uploadImageFromBase64(base64Image, fileName, bucket);
      
      return {
        status: 'success',
        message: 'Imagen subida exitosamente',
        data: {
          url,
          fileName: `${fileName}.jpg`
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Error al subir imagen: ${error.message}`
      };
    }
  }
}
