import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class JobService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createJobDto: CreateJobDto) {
    try {
      console.log('🔍 DEBUG: Creando job con datos:', createJobDto);
      
      // Verificar que el usuario existe
      const user = await this.prisma.user.findUnique({ 
        where: { id: createJobDto.id_user } 
      });
      
      if (!user) {
        return {
          status: 'error',
          message: 'El usuario no existe',
          data: null
        };
      }

      // Crear el trabajo
      const job = await this.prisma.job.create({
        data: {
          id_user: createJobDto.id_user,
          title: createJobDto.title,
          description: createJobDto.description,
          category: createJobDto.category,
          budget: createJobDto.budget,
          location: createJobDto.location,
          urgency: createJobDto.urgency || 'normal',
          status: createJobDto.status || 'open',
          professions: createJobDto.professions,
          images: createJobDto.images || Prisma.JsonNull,
          price: createJobDto.price,
          proposalsCount: createJobDto.proposalsCount || 0,
          viewsCount: createJobDto.viewsCount || 0,
          requirements: createJobDto.requirements || Prisma.JsonNull,
          timeline: createJobDto.timeline || null,
          workType: createJobDto.workType || null,
          
          // Google Maps Location Data
          location_address: createJobDto.location_address || null,
          location_lat: createJobDto.location_lat || null,
          location_lng: createJobDto.location_lng || null,
          location_place_id: createJobDto.location_place_id || null,
          location_bounds: createJobDto.location_bounds || Prisma.JsonNull,
          
          // Structured Location Data
          location_street: createJobDto.location_street || null,
          location_colony: createJobDto.location_colony || null,
          location_city: createJobDto.location_city || null,
          location_state: createJobDto.location_state || null,
          location_postal_code: createJobDto.location_postal_code || null,
          location_country: createJobDto.location_country || null,
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true,
              rating: true,
              reviewsCount: true
            }
          }
        }
      });

      console.log('✅ Job creado exitosamente:', job.id);

      return {
        status: 'success',
        message: 'Trabajo creado exitosamente',
        data: job
      };

    } catch (error) {
      console.error('❌ Error creando job:', error);
      return {
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      };
    }
  }

  async findAll() {
    try {
      const jobs = await this.prisma.job.findMany({
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true,
              rating: true,
              reviewsCount: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return {
        status: 'success',
        message: 'Trabajos obtenidos exitosamente',
        data: jobs
      };

    } catch (error) {
      console.error('❌ Error obteniendo jobs:', error);
      return {
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      };
    }
  }

  async findOne(id: number) {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true,
              rating: true,
              reviewsCount: true,
              description: true,
              phone: true
            }
          }
        }
      });

      if (!job) {
        return {
          status: 'error',
          message: 'Trabajo no encontrado',
          data: null
        };
      }

      // Incrementar el contador de vistas
      await this.prisma.job.update({
        where: { id },
        data: {
          viewsCount: job.viewsCount + 1
        }
      });

      return {
        status: 'success',
        message: 'Trabajo obtenido exitosamente',
        data: job
      };

    } catch (error) {
      console.error('❌ Error obteniendo job:', error);
      return {
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      };
    }
  }

  async update(id: number, updateJobDto: UpdateJobDto) {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id }
      });

      if (!job) {
        return {
          status: 'error',
          message: 'Trabajo no encontrado',
          data: null
        };
      }

      const updatedJob = await this.prisma.job.update({
        where: { id },
        data: {
          ...updateJobDto,
          updated_at: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true,
              rating: true,
              reviewsCount: true
            }
          }
        }
      });

      return {
        status: 'success',
        message: 'Trabajo actualizado exitosamente',
        data: updatedJob
      };

    } catch (error) {
      console.error('❌ Error actualizando job:', error);
      return {
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      };
    }
  }

  async remove(id: number) {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id }
      });

      if (!job) {
        return {
          status: 'error',
          message: 'Trabajo no encontrado',
          data: null
        };
      }

      await this.prisma.job.delete({
        where: { id }
      });

      return {
        status: 'success',
        message: 'Trabajo eliminado exitosamente',
        data: null
      };

    } catch (error) {
      console.error('❌ Error eliminando job:', error);
      return {
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      };
    }
  }

  async findByUser(userId: number) {
    try {
      const jobs = await this.prisma.job.findMany({
        where: { id_user: userId },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true,
              rating: true,
              reviewsCount: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return {
        status: 'success',
        message: 'Trabajos del usuario obtenidos exitosamente',
        data: jobs
      };

    } catch (error) {
      console.error('❌ Error obteniendo jobs del usuario:', error);
      return {
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      };
    }
  }

  async findByCategory(category: string) {
    try {
      const jobs = await this.prisma.job.findMany({
        where: { 
          category: {
            contains: category,
            mode: 'insensitive'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true,
              rating: true,
              reviewsCount: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return {
        status: 'success',
        message: 'Trabajos por categoría obtenidos exitosamente',
        data: jobs
      };

    } catch (error) {
      console.error('❌ Error obteniendo jobs por categoría:', error);
      return {
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      };
    }
  }
}
