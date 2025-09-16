import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLocalityDto } from './dto/create-locality.dto';
import { UpdateLocalityDto } from './dto/update-locality.dto';

@Injectable()
export class LocalitiesService {
  constructor(private prisma: PrismaService) {}

  async create(createLocalityDto: CreateLocalityDto) {
    try {
      const locality = await this.prisma.locality.create({
        data: createLocalityDto,
        include: {
          state: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          municipality: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          jobs: true
        }
      });

      return {
        status: 'success',
        message: 'Localidad creada exitosamente',
        data: locality
      };
    } catch (error) {
      console.error('Error en create locality:', error);
      return {
        status: 'error',
        message: 'Error al crear la localidad'
      };
    }
  }

  async findAll() {
    try {
      const localities = await this.prisma.locality.findMany({
        include: {
          state: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          municipality: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          _count: {
            select: {
              jobs: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return {
        status: 'success',
        message: 'Localidades obtenidas exitosamente',
        data: localities
      };
    } catch (error) {
      console.error('Error en findAll localities:', error);
      return {
        status: 'error',
        message: 'Error al obtener las localidades'
      };
    }
  }

  async findByState(stateId: number) {
    try {
      const localities = await this.prisma.locality.findMany({
        where: { id_state: stateId },
        include: {
          state: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          municipality: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          _count: {
            select: {
              jobs: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return {
        status: 'success',
        message: 'Localidades del estado obtenidas exitosamente',
        data: localities
      };
    } catch (error) {
      console.error('Error en findByState localities:', error);
      return {
        status: 'error',
        message: 'Error al obtener las localidades del estado'
      };
    }
  }

  async findByMunicipality(municipalityId: number) {
    try {
      const localities = await this.prisma.locality.findMany({
        where: { id_municipality: municipalityId },
        include: {
          state: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          municipality: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          _count: {
            select: {
              jobs: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return {
        status: 'success',
        message: 'Localidades del municipio obtenidas exitosamente',
        data: localities
      };
    } catch (error) {
      console.error('Error en findByMunicipality localities:', error);
      return {
        status: 'error',
        message: 'Error al obtener las localidades del municipio'
      };
    }
  }

  async findOne(id: number) {
    try {
      const locality = await this.prisma.locality.findUnique({
        where: { id },
        include: {
          state: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          municipality: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          _count: {
            select: {
              jobs: true
            }
          }
        }
      });

      if (!locality) {
        return {
          status: 'warning',
          message: 'Localidad no encontrada'
        };
      }

      return {
        status: 'success',
        message: 'Localidad encontrada',
        data: locality
      };
    } catch (error) {
      console.error('Error en findOne locality:', error);
      return {
        status: 'error',
        message: 'Error al obtener la localidad'
      };
    }
  }

  async update(id: number, updateLocalityDto: UpdateLocalityDto) {
    try {
      const existingLocality = await this.prisma.locality.findUnique({
        where: { id }
      });

      if (!existingLocality) {
        return {
          status: 'warning',
          message: 'Localidad no encontrada'
        };
      }

      const locality = await this.prisma.locality.update({
        where: { id },
        data: updateLocalityDto,
        include: {
          state: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          municipality: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        }
      });

      return {
        status: 'success',
        message: 'Localidad actualizada exitosamente',
        data: locality
      };
    } catch (error) {
      console.error('Error en update locality:', error);
      return {
        status: 'error',
        message: 'Error al actualizar la localidad'
      };
    }
  }

  async remove(id: number) {
    try {
      const existingLocality = await this.prisma.locality.findUnique({
        where: { id }
      });

      if (!existingLocality) {
        return {
          status: 'warning',
          message: 'Localidad no encontrada'
        };
      }

      await this.prisma.locality.delete({
        where: { id }
      });

      return {
        status: 'success',
        message: 'Localidad eliminada exitosamente'
      };
    } catch (error) {
      console.error('Error en remove locality:', error);
      return {
        status: 'error',
        message: 'Error al eliminar la localidad'
      };
    }
  }
}
