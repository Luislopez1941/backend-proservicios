# Configuración de Supabase Storage para Imágenes

## 1. Crear Bucket en Supabase

### Opción A: Desde el Dashboard de Supabase
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Storage** en el menú lateral
3. Haz clic en **"New bucket"**
4. Configura el bucket:
   - **Name**: `user-images`
   - **Public bucket**: ✅ **SÍ** (marcado)
   - **File size limit**: `50MB` (o el límite que prefieras)
   - **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp`

### Opción B: Usando SQL (Recomendado)
Ejecuta este SQL en el **SQL Editor** de Supabase:

```sql
-- Crear el bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-images',
  'user-images', 
  true,
  52428800, -- 50MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Crear políticas de acceso
-- Política para lectura pública
CREATE POLICY "Public Access" ON storage.objects FOR SELECT 
USING (bucket_id = 'user-images');

-- Política para inserción (usuarios autenticados)
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'user-images' 
  AND auth.role() = 'authenticated'
);

-- Política para actualización (usuarios autenticados)
CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'user-images' 
  AND auth.role() = 'authenticated'
);

-- Política para eliminación (usuarios autenticados)
CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE 
USING (
  bucket_id = 'user-images' 
  AND auth.role() = 'authenticated'
);
```

## 2. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# Supabase Configuration
SUPABASE_URL="https://tu-proyecto-id.supabase.co"
SUPABASE_ANON_KEY="tu_clave_anonima_aqui"
```

### Cómo obtener estas variables:
1. Ve a **Settings** → **API** en tu dashboard de Supabase
2. **Project URL**: Copia la URL del proyecto
3. **anon public**: Copia la clave pública

## 3. Verificar Configuración

Una vez configurado, puedes verificar que todo funciona:

```bash
# Verificar configuración
curl "http://localhost:3000/user/config/check"

# Probar subida de imagen
curl -X PUT "http://localhost:3000/user/update/worker/5" \
  -H "Content-Type: application/json" \
  -d '{
    "profilePhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
  }'
```

## 4. Estructura de Respuesta Esperada

Cuando la imagen se suba correctamente, recibirás:

```json
{
  "status": "success",
  "message": "Usuario actualizado exitosamente",
  "data": {
    "id": 5,
    "profilePhoto": "https://tu-proyecto-id.supabase.co/storage/v1/object/public/user-images/profile-5-1234567890.jpg",
    "background": null,
    "workPhotos": null
  }
}
```

## 5. Solución de Problemas

### Error: "API_KEY_GOOGLE no está configurada"
- Verifica que `SUPABASE_URL` y `SUPABASE_ANON_KEY` estén en tu `.env`
- Reinicia el servidor después de agregar las variables

### Error: "Error al procesar la foto de perfil"
- Verifica que el bucket `user-images` existe
- Verifica que las políticas de acceso están configuradas
- Verifica que el base64 es válido y completo

### Error: "Bucket not found"
- Ejecuta el SQL para crear el bucket
- Verifica que el nombre del bucket sea exactamente `user-images`

## 6. Límites Recomendados

- **Tamaño máximo por imagen**: 5-10MB
- **Formatos soportados**: JPEG, PNG, GIF, WebP
- **Resolución recomendada**: Máximo 1920x1080
- **Compresión**: Usa compresión antes de enviar al backend
