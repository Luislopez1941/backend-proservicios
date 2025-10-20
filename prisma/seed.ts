import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY deben estar configurados en el .env');
  process.exit(1);
}

// Usar service key para crear buckets (tiene permisos de administrador)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSupabaseBuckets() {
  try {
    console.log('🪣 Creando buckets de Supabase Storage...');
    
    // Verificar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error al verificar buckets existentes:', listError);
      return;
    }

    // Definir los buckets que necesitamos crear
    const bucketsToCreate = [
      { name: 'profile-photos', description: 'Fotos de perfil de usuarios' },
      { name: 'background-images', description: 'Imágenes de fondo de usuarios' },
      { name: 'work-photos', description: 'Fotos de trabajos realizados' },
      { name: 'job-proposals', description: 'Imágenes de propuestas de trabajo' }
    ];

    for (const bucketConfig of bucketsToCreate) {
      const existingBucket = buckets.find(bucket => bucket.name === bucketConfig.name);
      
      if (existingBucket) {
        console.log(`✅ Bucket "${bucketConfig.name}" ya existe`);
        continue;
      }

      // Crear el bucket usando la API REST de Supabase con service key
      const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        } as HeadersInit,
        body: JSON.stringify({
          name: bucketConfig.name,
          public: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ Error al crear bucket "${bucketConfig.name}":`, errorData.message || response.statusText);
        continue;
      }

      const bucketData = await response.json();
      console.log(`✅ Bucket "${bucketConfig.name}" creado exitosamente`);
      console.log(`   - Descripción: ${bucketConfig.description}`);
      console.log(`   - ID: ${bucketData.id}`);
      console.log(`   - Público: ${bucketData.public}`);
    }
    
  } catch (error) {
    console.error('❌ Error al crear buckets:', error);
  }
}

async function seedDatabase() {
  try {
    console.log('🚀 Iniciando proceso de seeding con Google Maps...');
    
    // Crear buckets de Supabase primero
    await createSupabaseBuckets();

    // Lista de profesiones
    const profesiones = [
      'Albañil', 'Plomero', 'Electricista', 'Carpintero', 'Pintor',
      'Jardinero', 'Mecánico', 'Cerrajero', 'Soldador', 'Técnico en Aires Acondicionados',
      'Limpieza del Hogar', 'Cocinero(a)', 'Sastre/Costurero(a)', 'Peluquero(a)', 'Masajista',
      'Técnico en Computación', 'Fotógrafo', 'Diseñador Gráfico', 'Profesor Particular', 'Entrenador Personal'
    ];

    // Insertar profesiones
    for (const profesion of profesiones) {
      await prisma.profession.upsert({
        where: { name: profesion },
        update: {},
        create: { name: profesion }
      });
      console.log(`Profesión creada: ${profesion}`);
    }

    // No crear usuarios - solo profesiones

    console.log('🎉 ¡Base de datos poblada exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - ${profesiones.length} profesiones creadas`);
    console.log('   - 0 usuarios creados');
    console.log('   - Ubicaciones configuradas con Google Maps');

  } catch (error) {
    console.error('❌ Error al poblar la base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seeder
seedDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
