import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { SearchJobsDto } from './dto/search-jobs.dto';
import { SearchJobsByLocationDto } from './dto/search-jobs-location.dto';
import { SearchJobsByProfessionDto } from './dto/search-jobs-profession.dto';
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

  async searchJobsByLocation(searchParams: SearchJobsByLocationDto) {
    try {
      const { location, professions, page = 1, limit = 10 } = searchParams;
      const skip = (page - 1) * limit;

      // Construir filtros dinámicos
      const where: any = {};

      // Filtro por ubicación
      if (location) {
        // Búsqueda por place_id (Google Places)
        if (location.place_id) {
          where.location_place_id = location.place_id;
        }
        
        // Búsqueda por descripción o main_text
        if (location.description || location.main_text) {
          const searchText = location.description || location.main_text;
          where.OR = [
            {
              location_address: {
                contains: searchText,
                mode: 'insensitive'
              }
            },
            {
              location_city: {
                contains: searchText,
                mode: 'insensitive'
              }
            },
            {
              location_state: {
                contains: searchText,
                mode: 'insensitive'
              }
            }
          ];
        }
        
        // Búsqueda por campos específicos
        if (location.location_city) {
          where.location_city = {
            contains: location.location_city,
            mode: 'insensitive'
          };
        }
        if (location.location_state) {
          where.location_state = {
            contains: location.location_state,
            mode: 'insensitive'
          };
        }
        if (location.location_country) {
          where.location_country = {
            contains: location.location_country,
            mode: 'insensitive'
          };
        }
        if (location.location_postal_code) {
          where.location_postal_code = location.location_postal_code;
        }
        if (location.place_id) {
          where.location_place_id = location.place_id;
        }
        if (location.location_lat && location.location_lng) {
          // Búsqueda por proximidad (radio de 10km)
          const radius = 0.1; // Aproximadamente 10km
          where.AND = [
            {
              location_lat: {
                gte: location.location_lat - radius,
                lte: location.location_lat + radius
              }
            },
            {
              location_lng: {
                gte: location.location_lng - radius,
                lte: location.location_lng + radius
              }
            }
          ];
        }
      }

      // Filtro por profesiones
      if (professions && professions.length > 0) {
        // Buscar trabajos que contengan alguna de las profesiones especificadas
        const professionNames = professions.map(prof => prof.name).filter(name => name);
        const professionIds = professions.map(prof => prof.id).filter(id => id);
        
        if (professionNames.length > 0 || professionIds.length > 0) {
          where.OR = [];
          
          // Buscar por nombres de profesiones
          professionNames.forEach(name => {
            where.OR.push({
              professions: {
                path: '$',
                string_contains: name
              }
            });
          });
          
          // Buscar por IDs de profesiones
          professionIds.forEach(id => {
            where.OR.push({
              professions: {
                path: '$',
                string_contains: `"id":${id}`
              }
            });
          });
        }
      }

      const jobs = await this.prisma.job.findMany({
        where,
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
        },
        skip,
        take: limit
      });

      const total = await this.prisma.job.count({ where });

      return {
        status: 'success',
        message: 'Trabajos filtrados por ubicación obtenidos exitosamente',
        data: {
          jobs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };

    } catch (error) {
      console.error('❌ Error buscando trabajos por ubicación:', error);
      return {
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      };
    }
  }

  async searchJobsByProfession(searchParams: SearchJobsByProfessionDto) {
    try {
      const { professions, page = 1, limit = 10 } = searchParams;
      const skip = (page - 1) * limit;

      // Construir filtros dinámicos
      const where: any = {};

      // Filtro por profesiones
      if (professions && professions.length > 0) {
        // Buscar trabajos que contengan alguna de las profesiones especificadas
        const professionNames = professions.map(prof => prof.name).filter(name => name);
        const professionIds = professions.map(prof => prof.id).filter(id => id);
        
        if (professionNames.length > 0 || professionIds.length > 0) {
          where.OR = [];
          
          // Buscar por nombres de profesiones
          professionNames.forEach(name => {
            where.OR.push({
              professions: {
                path: '$',
                string_contains: name
              }
            });
          });
          
          // Buscar por IDs de profesiones
          professionIds.forEach(id => {
            where.OR.push({
              professions: {
                path: '$',
                string_contains: `"id":${id}`
              }
            });
          });
        }
      }

      const jobs = await this.prisma.job.findMany({
        where,
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
        },
        skip,
        take: limit
      });

      const total = await this.prisma.job.count({ where });

      return {
        status: 'success',
        message: 'Trabajos filtrados por profesión obtenidos exitosamente',
        data: {
          jobs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };

    } catch (error) {
      console.error('❌ Error buscando trabajos por profesión:', error);
      return {
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      };
    }
  }

  async searchJobs(searchParams: SearchJobsDto) {
    try {
      const { 
        searchTerm, 
        category, 
        urgency, 
        status, 
        workType, 
        minPrice, 
        maxPrice,
        location,
        professions,
        page = 1, 
        limit = 10 
      } = searchParams;
      const skip = (page - 1) * limit;

      // Construir filtros dinámicos
      const where: any = {};

      // Búsqueda por término general
      if (searchTerm) {
        where.OR = [
          {
            title: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            location: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        ];
      }

      // Filtros específicos
      if (category) {
        where.category = {
          contains: category,
          mode: 'insensitive'
        };
      }
      if (urgency) {
        where.urgency = urgency;
      }
      if (status) {
        where.status = status;
      }
      if (workType) {
        where.workType = workType;
      }

      // Filtro por rango de precios
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) {
          where.price.gte = minPrice.toString();
        }
        if (maxPrice !== undefined) {
          where.price.lte = maxPrice.toString();
        }
      }

      // Filtro por ubicación
      if (location) {
        // Búsqueda por place_id (Google Places)
        if (location.place_id) {
          where.location_place_id = location.place_id;
        }
        
        // Búsqueda por descripción o main_text
        if (location.description || location.main_text) {
          const searchText = location.description || location.main_text;
          const locationFilters = [
            {
              location_address: {
                contains: searchText,
                mode: 'insensitive'
              }
            },
            {
              location_city: {
                contains: searchText,
                mode: 'insensitive'
              }
            },
            {
              location_state: {
                contains: searchText,
                mode: 'insensitive'
              }
            }
          ];
          
          if (where.OR) {
            where.AND = [where.OR, { OR: locationFilters }];
            delete where.OR;
          } else {
            where.OR = locationFilters;
          }
        }
      }

      // Filtro por profesiones
      if (professions && professions.length > 0) {
        const professionNames = professions.map(prof => prof.name).filter(name => name);
        const professionIds = professions.map(prof => prof.id).filter(id => id);
        
        if (professionNames.length > 0 || professionIds.length > 0) {
          const professionFilters: any[] = [];
          
          // Buscar por nombres de profesiones
          professionNames.forEach(name => {
            professionFilters.push({
              professions: {
                path: '$',
                string_contains: name
              }
            });
          });
          
          // Buscar por IDs de profesiones
          professionIds.forEach(id => {
            professionFilters.push({
              professions: {
                path: '$',
                string_contains: `"id":${id}`
              }
            });
          });

          if (where.OR) {
            where.AND = [where.OR, { OR: professionFilters }];
            delete where.OR;
          } else {
            where.OR = professionFilters;
          }
        }
      }

      const jobs = await this.prisma.job.findMany({
        where,
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
        },
        skip,
        take: limit
      });

      const total = await this.prisma.job.count({ where });

      return {
        status: 'success',
        message: 'Trabajos encontrados exitosamente',
        data: {
          jobs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };

    } catch (error) {
      console.error('❌ Error buscando trabajos:', error);
      return {
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      };
    }
  }
}
