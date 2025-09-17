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
      { name: 'work-photos', description: 'Fotos de trabajos realizados' }
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
    console.log('👥 Creando usuarios de ejemplo...');

    // Usuario 1: Cliente en Ciudad de México
    await prisma.user.upsert({
      where: { email: 'cliente1@example.com' },
      update: {},
      create: {
        first_name: 'Juan',
        first_surname: 'Pérez',
        email: 'cliente1@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
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
    console.log('Cliente creado: Juan Pérez');

    // Usuario 2: Profesional en Mérida
    await prisma.user.upsert({
      where: { email: 'profesional1@example.com' },
      update: {},
      create: {
        first_name: 'María',
        first_surname: 'García',
        email: 'profesional1@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        phone: '+52 999 123 4567',
        type_user: 'worker',
        description: 'Plomera con 5 años de experiencia',
        professions: ['Plomero'],
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
    console.log('Profesional creado: María García');

    // Usuario 3: Profesional en Cancún
    await prisma.user.upsert({
      where: { email: 'profesional2@example.com' },
      update: {},
      create: {
        first_name: 'Carlos',
        first_surname: 'López',
        email: 'profesional2@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        phone: '+52 998 765 4321',
        type_user: 'worker',
        description: 'Electricista certificado',
        professions: ['Electricista'],
        location_address: 'Av. Tulum 456, Centro, 77500 Cancún, Q.R., México',
        location_lat: 21.1619,
        location_lng: -86.8515,
        location_place_id: 'ChIJ8VQyqQqG1o8RqJzQzQzQzQzQ',
        location_bounds: {
          northeast: { lat: 21.1629, lng: -86.8505 },
          southwest: { lat: 21.1609, lng: -86.8525 }
        }
      }
    });
    console.log('Profesional creado: Carlos López');

    console.log('🎉 ¡Base de datos poblada exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - ${profesiones.length} profesiones creadas`);
    console.log('   - 3 usuarios de ejemplo creados');
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
