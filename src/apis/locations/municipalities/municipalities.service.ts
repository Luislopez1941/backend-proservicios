import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMunicipalityDto } from './dto/create-municipality.dto';
import { UpdateMunicipalityDto } from './dto/update-municipality.dto';

@Injectable()
export class MunicipalitiesService {
  constructor(private prisma: PrismaService) {}

  async create(createMunicipalityDto: CreateMunicipalityDto) {
    try {
      const municipality = await this.prisma.municipality.create({
        data: createMunicipalityDto,
        include: {
          state: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          localities: true,
          users: true,
          jobs: true
        }
      });

      return {
        status: 'success',
        message: 'Municipio creado exitosamente',
        data: municipality
      };
    } catch (error) {
      console.error('Error en create municipality:', error);
      return {
        status: 'error',
        message: 'Error al crear el municipio'
      };
    }
  }

  async findAll() {
    try {
      const municipalities = await this.prisma.municipality.findMany({
        include: {
          state: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          localities: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          _count: {
            select: {
              users: true,
              jobs: true,
              localities: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return {
        status: 'success',
        message: 'Municipios obtenidos exitosamente',
        data: municipalities
      };
    } catch (error) {
      console.error('Error en findAll municipalities:', error);
      return {
        status: 'error',
        message: 'Error al obtener los municipios'
      };
    }
  }

  async findByState(stateId: number) {
    try {
      const municipalities = await this.prisma.municipality.findMany({
        where: { id_state: stateId },
        include: {
          state: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          localities: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          _count: {
            select: {
              users: true,
              jobs: true,
              localities: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return {
        status: 'success',
        message: 'Municipios del estado obtenidos exitosamente',
        data: municipalities
      };
    } catch (error) {
      console.error('Error en findByState municipalities:', error);
      return {
        status: 'error',
        message: 'Error al obtener los municipios del estado'
      };
    }
  }

  async findOne(id: number) {
    try {
      const municipality = await this.prisma.municipality.findUnique({
        where: { id },
        include: {
          state: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          localities: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          _count: {
            select: {
              users: true,
              jobs: true,
              localities: true
            }
          }
        }
      });

      if (!municipality) {
        return {
          status: 'warning',
          message: 'Municipio no encontrado'
        };
      }

      return {
        status: 'success',
        message: 'Municipio encontrado',
        data: municipality
      };
    } catch (error) {
      console.error('Error en findOne municipality:', error);
      return {
        status: 'error',
        message: 'Error al obtener el municipio'
      };
    }
  }

  async update(id: number, updateMunicipalityDto: UpdateMunicipalityDto) {
    try {
      const existingMunicipality = await this.prisma.municipality.findUnique({
        where: { id }
      });

      if (!existingMunicipality) {
        return {
          status: 'warning',
          message: 'Municipio no encontrado'
        };
      }

      const municipality = await this.prisma.municipality.update({
        where: { id },
        data: updateMunicipalityDto,
        include: {
          state: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          localities: {
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
        message: 'Municipio actualizado exitosamente',
        data: municipality
      };
    } catch (error) {
      console.error('Error en update municipality:', error);
      return {
        status: 'error',
        message: 'Error al actualizar el municipio'
      };
    }
  }

  async remove(id: number) {
    try {
      const existingMunicipality = await this.prisma.municipality.findUnique({
        where: { id }
      });

      if (!existingMunicipality) {
        return {
          status: 'warning',
          message: 'Municipio no encontrado'
        };
      }

      await this.prisma.municipality.delete({
        where: { id }
      });

      return {
        status: 'success',
        message: 'Municipio eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error en remove municipality:', error);
      return {
        status: 'error',
        message: 'Error al eliminar el municipio'
      };
    }
  }
}
