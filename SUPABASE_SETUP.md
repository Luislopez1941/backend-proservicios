# Configuración de Supabase para Imágenes

## Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env`:

```env
# Supabase Configuration
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_ANON_KEY="tu_clave_anonima_aqui"
```

## Configuración en Supabase

1. **Crear un bucket llamado `user-images`**:
   - Ve a Storage en tu dashboard de Supabase
   - Crea un nuevo bucket llamado `user-images`
   - Configura las políticas de acceso según tus necesidades

2. **Políticas de Storage recomendadas**:
   ```sql
   -- Permitir lectura pública
   CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'user-images');
   
   -- Permitir inserción autenticada
   CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT 
   WITH CHECK (bucket_id = 'user-images' AND auth.role() = 'authenticated');
   
   -- Permitir actualización autenticada
   CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE 
   USING (bucket_id = 'user-images' AND auth.role() = 'authenticated');
   
   -- Permitir eliminación autenticada
   CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE 
   USING (bucket_id = 'user-images' AND auth.role() = 'authenticated');
   ```

## Ejemplo de Uso del Endpoint

### Actualizar solo foto de perfil:
```bash
curl -X PATCH "http://localhost:3000/user/update/profile/1" \
  -H "Content-Type: application/json" \
  -d '{
    "profilePhoto": {
      "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
    }
  }'
```

### Actualizar múltiples imágenes:
```bash
curl -X PATCH "http://localhost:3000/user/update/profile/1" \
  -H "Content-Type: application/json" \
  -d '{
    "profilePhoto": {
      "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
    },
    "background": {
      "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
    },
    "workPhotos": [
      {
        "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
      },
      {
        "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
      }
    ]
  }'
```

### Respuesta esperada:
```json
{
  "status": "success",
  "message": "Usuario actualizado exitosamente",
  "data": {
    "id": 1,
    "first_name": "Luis",
    "profilePhoto": "https://tu-proyecto.supabase.co/storage/v1/object/public/user-images/profile-1-1234567890.jpg",
    "background": "https://tu-proyecto.supabase.co/storage/v1/object/public/user-images/background-1-1234567890.jpg",
    "workPhotos": [
      "https://tu-proyecto.supabase.co/storage/v1/object/public/user-images/work-1-1234567890.jpg",
      "https://tu-proyecto.supabase.co/storage/v1/object/public/user-images/work-1-1234567891.jpg"
    ]
  }
}
```

## Formatos de Imagen Soportados

- JPEG/JPG
- PNG
- GIF
- WebP

## Límites Recomendados

- Tamaño máximo por imagen: 5MB
- Resolución recomendada: 1920x1080 o menor
- Formato base64 debe incluir el prefijo: `data:image/[tipo];base64,`
