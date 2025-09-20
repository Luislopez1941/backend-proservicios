import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseStorageService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('SUPABASE_URL y SUPABASE_ANON_KEY deben estar configurados');
    }

    // Usar service key para todas las operaciones de storage
    this.supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
    this.serviceKey = supabaseServiceKey;
  }

  private serviceKey?: string;

  /**
   * Convierte base64 a buffer y sube la imagen a Supabase Storage
   */
  async uploadImageFromBase64(
    base64Data: string,
    fileName: string,
    bucket: string = 'profile-photos'
  ): Promise<string> {
    try {
      // Validar que sea base64 válido
      if (!this.isValidBase64Image(base64Data)) {
        throw new Error('Formato de imagen base64 inválido');
      }

      // Extraer el tipo de imagen del base64
      const imageType = this.extractImageType(base64Data);
      const fileExtension = this.getFileExtension(imageType);
      
      // Generar nombre único para el archivo
      const uniqueFileName = `${Date.now()}-${fileName}.${fileExtension}`;
      
      // Convertir base64 a buffer
      const buffer = this.base64ToBuffer(base64Data);
      
      // Verificar que el bucket existe primero
      this.logger.log(`Verificando bucket: ${bucket}`);
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
      
      if (listError) {
        this.logger.error('Error al listar buckets:', listError);
        throw new Error(`Error al verificar buckets: ${listError.message}`);
      }

      const bucketExists = buckets.find(b => b.name === bucket);
      if (!bucketExists) {
        this.logger.error(`Bucket '${bucket}' no encontrado. Buckets disponibles:`, buckets.map(b => b.name));
        throw new Error(`El bucket '${bucket}' no existe. Buckets disponibles: ${buckets.map(b => b.name).join(', ')}`);
      }

      this.logger.log(`Bucket '${bucket}' encontrado, subiendo imagen...`);

      // Subir a Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(uniqueFileName, buffer, {
          contentType: imageType,
          upsert: false
        });

      if (error) {
        this.logger.error('Error al subir imagen a Supabase:', error);
        
        // Si el error es que el bucket no existe, dar un mensaje más claro
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          throw new Error(`El bucket '${bucket}' no existe. Por favor, créalo desde el dashboard de Supabase.`);
        }
        
        throw new Error(`Error al subir imagen: ${error.message}`);
      }

      // Obtener URL pública
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(uniqueFileName);

      this.logger.log(`Imagen subida exitosamente: ${uniqueFileName}`);
      return urlData.publicUrl;

    } catch (error) {
      this.logger.error('Error en uploadImageFromBase64:', error);
      throw new Error('Error al procesar y subir la imagen');
    }
  }

  /**
   * Sube múltiples imágenes desde base64
   */
  async uploadMultipleImagesFromBase64(
    base64Images: string[],
    fileNamePrefix: string,
    bucket: string = 'profile-photos'
  ): Promise<string[]> {
    if (!base64Images || base64Images.length === 0) {
      return [];
    }

    // Verificar que el bucket existe primero
    try {
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
      
      if (listError) {
        this.logger.error('Error al listar buckets:', listError);
        throw new Error(`Error al verificar buckets: ${listError.message}`);
      }

      const bucketExists = buckets.find(b => b.name === bucket);
      if (!bucketExists) {
        this.logger.error(`Bucket '${bucket}' no encontrado. Buckets disponibles:`, buckets.map(b => b.name));
        throw new Error(`El bucket '${bucket}' no existe. Buckets disponibles: ${buckets.map(b => b.name).join(', ')}`);
      }

      this.logger.log(`Bucket '${bucket}' encontrado, subiendo ${base64Images.length} imágenes...`);
    } catch (error) {
      this.logger.error('Error verificando bucket:', error);
      throw error;
    }

    const uploadPromises = base64Images.map(async (base64, index) => {
      try {
        return await this.uploadImageFromBase64(base64, `${fileNamePrefix}-${index}`, bucket);
      } catch (error) {
        this.logger.error(`Error subiendo imagen ${index}:`, error);
        throw new Error(`Error subiendo imagen ${index + 1}: ${error.message}`);
      }
    });

    try {
      const urls = await Promise.all(uploadPromises);
      this.logger.log(`${urls.length} imágenes subidas exitosamente`);
      return urls;
    } catch (error) {
      this.logger.error('Error al subir múltiples imágenes:', error);
      throw new Error(`Error al subir imágenes: ${error.message}`);
    }
  }

  /**
   * Sube foto de perfil específicamente
   */
  async uploadProfilePhoto(base64Data: string, userId: number): Promise<string> {
    return this.uploadImageFromBase64(base64Data, `profile-${userId}`, 'profile-photos');
  }

  /**
   * Sube imagen de fondo específicamente
   */
  async uploadBackgroundImage(base64Data: string, userId: number): Promise<string> {
    return this.uploadImageFromBase64(base64Data, `background-${userId}`, 'profile-photos'); // Usar el mismo bucket por ahora
  }

  /**
   * Sube fotos de trabajo específicamente
   */
  async uploadWorkPhotos(base64Images: string[], userId: number): Promise<string[]> {
    return this.uploadMultipleImagesFromBase64(base64Images, `work-${userId}`, 'profile-photos'); // Usar el mismo bucket por ahora
  }

  /**
   * Sube imágenes de propuesta de trabajo específicamente
   */
  async uploadProposalImages(base64Images: string[], proposalId: number): Promise<string[]> {
    // Asegurar que el bucket job-proposals existe
    await this.ensureBucketExists('job-proposals');
    return this.uploadMultipleImagesFromBase64(base64Images, `proposal-${proposalId}`, 'job-proposals');
  }

  /**
   * Sube una imagen de propuesta de trabajo específicamente
   */
  async uploadProposalImage(base64Data: string, proposalId: number, imageIndex: number = 0): Promise<string> {
    // Asegurar que el bucket job-proposals existe
    await this.ensureBucketExists('job-proposals');
    return this.uploadImageFromBase64(base64Data, `proposal-${proposalId}-${imageIndex}`, 'job-proposals');
  }

  /**
   * Asegura que un bucket existe, si no existe lo crea
   */
  async ensureBucketExists(bucketName: string): Promise<void> {
    try {
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
      
      if (listError) {
        this.logger.error('Error al listar buckets:', listError);
        throw new Error(`Error al verificar buckets: ${listError.message}`);
      }

      const bucketExists = buckets.find(b => b.name === bucketName);
      if (bucketExists) {
        this.logger.log(`Bucket '${bucketName}' ya existe`);
        return;
      }

      // Crear el bucket si no existe
      this.logger.log(`Creando bucket '${bucketName}'...`);
      const bucketData = await this.createBucketWithServiceKey(bucketName, true);
      this.logger.log(`Bucket '${bucketName}' creado exitosamente`);
      
    } catch (error) {
      this.logger.error(`Error asegurando bucket '${bucketName}':`, error);
      throw new Error(`Error al crear bucket '${bucketName}': ${error.message}`);
    }
  }

  /**
   * Elimina una imagen de Supabase Storage
   */
  async deleteImage(filePath: string, bucket: string = 'user-images'): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        this.logger.error('Error al eliminar imagen:', error);
        return false;
      }

      this.logger.log(`Imagen eliminada: ${filePath}`);
      return true;
    } catch (error) {
      this.logger.error('Error en deleteImage:', error);
      return false;
    }
  }

  /**
   * Elimina imágenes de propuesta de trabajo específicamente
   */
  async deleteProposalImages(imageUrls: string[]): Promise<boolean> {
    try {
      if (!imageUrls || imageUrls.length === 0) {
        return true;
      }

      // Extraer nombres de archivo de las URLs
      const filePaths = imageUrls.map(url => {
        const urlParts = url.split('/');
        return urlParts[urlParts.length - 1];
      });

      const { error } = await this.supabase.storage
        .from('job-proposals')
        .remove(filePaths);

      if (error) {
        this.logger.error('Error al eliminar imágenes de propuesta:', error);
        return false;
      }

      this.logger.log(`${filePaths.length} imágenes de propuesta eliminadas`);
      return true;
    } catch (error) {
      this.logger.error('Error en deleteProposalImages:', error);
      return false;
    }
  }

  /**
   * Valida si el string es un base64 de imagen válido
   */
  private isValidBase64Image(base64: string): boolean {
    // Verificar formato base64 de imagen
    const imageRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
    return imageRegex.test(base64);
  }

  /**
   * Extrae el tipo de imagen del base64
   */
  private extractImageType(base64: string): string {
    const match = base64.match(/^data:image\/([a-zA-Z]*);base64,/);
    return match ? match[1] : 'jpeg';
  }

  /**
   * Obtiene la extensión de archivo basada en el tipo de imagen
   */
  private getFileExtension(imageType: string): string {
    const extensions: { [key: string]: string } = {
      'jpeg': 'jpg',
      'jpg': 'jpg',
      'png': 'png',
      'gif': 'gif',
      'webp': 'webp'
    };
    return extensions[imageType.toLowerCase()] || 'jpg';
  }

  /**
   * Convierte base64 a buffer
   */
  private base64ToBuffer(base64: string): Buffer {
    // Remover el prefijo data:image/...;base64,
    const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }

  /**
   * Genera un nombre de archivo único basado en el tipo de imagen
   */
  generateUniqueFileName(originalName: string, imageType: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = this.getFileExtension(imageType);
    return `${originalName}-${timestamp}-${randomString}.${extension}`;
  }

  /**
   * Crea un nuevo bucket en Supabase Storage
   */
  async createBucket(bucketName: string, isPublic: boolean = true): Promise<any> {
    try {
      // Nota: La creación de buckets requiere permisos de administrador
      // Este método puede necesitar ser implementado usando la API REST de Supabase
      // Por ahora, retornamos un mensaje informativo
      
      this.logger.log(`Intentando crear bucket: ${bucketName} (público: ${isPublic})`);
      
      // Verificar si el bucket ya existe
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
      
      if (listError) {
        throw new Error(`Error al verificar buckets existentes: ${listError.message}`);
      }

      const existingBucket = buckets.find(bucket => bucket.name === bucketName);
      if (existingBucket) {
        this.logger.log(`Bucket ${bucketName} ya existe`);
        return {
          name: bucketName,
          id: existingBucket.id,
          public: existingBucket.public,
          created_at: existingBucket.created_at
        };
      }

      // Crear el bucket usando la API REST de Supabase
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
      const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('SUPABASE_URL y SUPABASE_ANON_KEY deben estar configurados');
      }

      const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          name: bucketName,
          public: isPublic
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al crear bucket: ${errorData.message || response.statusText}`);
      }

      const bucketData = await response.json();
      this.logger.log(`Bucket ${bucketName} creado exitosamente`);
      
      return bucketData;
    } catch (error) {
      this.logger.error('Error en createBucket:', error);
      throw new Error(`Error al crear bucket: ${error.message}`);
    }
  }

  /**
   * Lista todos los buckets disponibles
   */
  async listBuckets(): Promise<any[]> {
    try {
      const { data: buckets, error } = await this.supabase.storage.listBuckets();
      
      if (error) {
        throw new Error(`Error al listar buckets: ${error.message}`);
      }

      this.logger.log(`${buckets.length} buckets encontrados`);
      return buckets;
    } catch (error) {
      this.logger.error('Error en listBuckets:', error);
      throw new Error(`Error al listar buckets: ${error.message}`);
    }
  }

  /**
   * Crea un bucket usando la service key
   */
  async createBucketWithServiceKey(bucketName: string, isPublic: boolean = true): Promise<any> {
    try {
      if (!this.serviceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada');
      }

      const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
      if (!supabaseUrl) {
        throw new Error('SUPABASE_URL no está configurada');
      }

      // Crear el bucket usando la API REST de Supabase con service key
      const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.serviceKey}`,
          'Content-Type': 'application/json',
          'apikey': this.serviceKey
        } as HeadersInit,
        body: JSON.stringify({
          name: bucketName,
          public: isPublic
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al crear bucket: ${errorData.message || response.statusText}`);
      }

      const bucketData = await response.json();
      this.logger.log(`Bucket "${bucketName}" creado exitosamente`);
      return bucketData;
    } catch (error) {
      this.logger.error('Error en createBucketWithServiceKey:', error);
      throw new Error(`Error al crear bucket: ${error.message}`);
    }
  }
}
