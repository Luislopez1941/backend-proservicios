import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🚀 Iniciando proceso de seeding...');

    // Lista de estados de México
    const estados = [
      'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
      'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
      'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
      'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
      'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
      'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán',
      'Zacatecas'
    ];

    // Lista de profesiones
    const profesiones = [
      'Albañil', 'Plomero', 'Electricista', 'Carpintero', 'Pintor',
      'Jardinero', 'Mecánico', 'Cerrajero', 'Soldador', 'Técnico en Aires Acondicionados',
      'Limpieza del Hogar', 'Cocinero(a)', 'Sastre/Costurero(a)', 'Peluquero(a)', 'Masajista',
      'Técnico en Computación', 'Fotógrafo', 'Diseñador Gráfico', 'Profesor Particular', 'Entrenador Personal'
    ];

    // Municipios de Yucatán
    const municipiosYucatan = [
      'Mérida', 'Valladolid', 'Tizimín', 'Progreso', 'Kanasín',
      'Umán', 'Ticul', 'Motul', 'Izamal', 'Tekax'
    ];

    // Municipios de Quintana Roo
    const municipiosQuintanaRoo = [
      'Cancún', 'Chetumal', 'Playa del Carmen', 'Cozumel', 'Tulum',
      'Isla Mujeres', 'Felipe Carrillo Puerto', 'Bacalar', 'Puerto Morelos', 'José María Morelos'
    ];

    // Insertar estados
    const statesMap = new Map();
    for (const estado of estados) {
      const stateRecord = await prisma.state.upsert({
        where: { name: estado },
        update: {},
        create: {
          name: estado,
          type: 'state'
        }
      });
      statesMap.set(estado, stateRecord.id);
      console.log(`Estado creado: ${estado}`);
    }

    // Insertar profesiones
    for (const profesion of profesiones) {
      await prisma.profession.upsert({
        where: { name: profesion },
        update: {},
        create: { name: profesion }
      });
      console.log(`Profesión creada: ${profesion}`);
    }

    // Insertar municipios de Yucatán
    const yucatanId = statesMap.get('Yucatán');
    if (yucatanId) {
      for (const municipio of municipiosYucatan) {
        await prisma.municipality.upsert({
          where: {
            municipalities_name_state_unique: {
              name: municipio,
              id_state: yucatanId
            }
          },
          update: {},
          create: {
            name: municipio,
            id_state: yucatanId,
            type: 'municipality'
          }
        });
        console.log(`Municipio de Yucatán creado: ${municipio}`);
      }
    }

    // Insertar municipios de Quintana Roo
    const quintanaRooId = statesMap.get('Quintana Roo');
    if (quintanaRooId) {
      for (const municipio of municipiosQuintanaRoo) {
        await prisma.municipality.upsert({
          where: {
            municipalities_name_state_unique: {
              name: municipio,
              id_state: quintanaRooId
            }
          },
          update: {},
          create: {
            name: municipio,
            id_state: quintanaRooId,
            type: 'municipality'
          }
        });
        console.log(`Municipio de Quintana Roo creado: ${municipio}`);
      }
    }

    // Poblar tabla de locations con datos de estados y municipios
    console.log('📍 Poblando tabla de locations...');

    // Obtener estados de la base de datos
    const states = await prisma.state.findMany({
      select: { id: true, name: true }
    });
    console.log(`Se encontraron ${states.length} estados`);

    // Insertar estados en locations
    for (const state of states) {
      await prisma.location.upsert({
        where: {
          id_location_type: {
            id_location: state.id,
            type: 'state'
          }
        },
        update: {},
        create: {
          id_location: state.id,
          name: state.name,
          type: 'state'
        }
      });
      console.log(`Estado agregado a locations: ${state.name}`);
    }

    // Obtener municipios con sus estados
    const municipalities = await prisma.municipality.findMany({
      select: {
        id: true,
        name: true,
        id_state: true,
        state: {
          select: { name: true }
        }
      }
    });
    console.log(`Se encontraron ${municipalities.length} municipios`);

    // Insertar municipios en locations
    for (const mun of municipalities) {
      await prisma.location.upsert({
        where: {
          id_location_type: {
            id_location: mun.id,
            type: 'municipality'
          }
        },
        update: {},
        create: {
          id_location: mun.id,
          name: `${mun.name}, ${mun.state.name}`,
          type: 'municipality'
        }
      });
      console.log(`Municipio agregado a locations: ${mun.name}, ${mun.state.name}`);
    }

    console.log('🎉 ¡Base de datos poblada exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - ${estados.length} estados creados`);
    console.log(`   - ${profesiones.length} profesiones creadas`);
    console.log(`   - ${municipiosYucatan.length} municipios de Yucatán creados`);
    console.log(`   - ${municipiosQuintanaRoo.length} municipios de Quintana Roo creados`);
    console.log(`   - ${states.length} estados agregados a locations`);
    console.log(`   - ${municipalities.length} municipios agregados a locations`);

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
