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

    // Crear usuarios de ejemplo con ubicaciones de Google Maps
    console.log('👥 Creando usuarios específicos...');

    // Usuario 1: Luis López
    await prisma.user.upsert({
      where: { email: 'Luis@gmail.com' },
      update: {},
      create: {
        first_name: 'Luis',
        first_surname: 'López',
        email: 'Luis@gmail.com',
        password: 'Luis2001',
        phone: '+52 55 1234 5678',
        type_user: 'client',
        location_address: 'Av. Reforma 123, Juárez, Cuauhtémoc, 06600 Ciudad de México, CDMX, México',
        location_lat: 19.4326,
        location_lng: -99.1332,
        location_place_id: 'ChIJdd4hrwug2EcRmSrV3Vo6llI',
        location_bounds: {
          northeast: { lat: 19.4336, lng: -99.1322 },
          southwest: { lat: 19.4316, lng: -99.1342 }
        }
      }
    });
    console.log('Usuario creado: Luis López');

    // Usuario 2: Esteban López
    await prisma.user.upsert({
      where: { email: 'Esteban@gmail.com' },
      update: {},
      create: {
        first_name: 'Esteban',
        first_surname: 'López',
        email: 'Esteban@gmail.com',
        password: 'Luis2001',
        phone: '+52 55 9876 5432',
        type_user: 'worker',
        description: 'Profesional con experiencia',
        professions: ['Albañil', 'Plomero'],
        location_address: 'Calle 60 #123, Centro, 97000 Mérida, Yuc., México',
        location_lat: 20.9674,
        location_lng: -89.5926,
        location_place_id: 'ChIJ8VQyqQqG1o8RqJzQzQzQzQzQ',
        location_bounds: {
          northeast: { lat: 20.9684, lng: -89.5916 },
          southwest: { lat: 20.9664, lng: -89.5936 }
        }
      }
    });
    console.log('Usuario creado: Esteban López');

    console.log('🎉 ¡Base de datos poblada exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - ${profesiones.length} profesiones creadas`);
    console.log('   - 2 usuarios específicos creados');
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
