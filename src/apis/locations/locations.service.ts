import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async create(createLocationDto: CreateLocationDto) {
    try {
      const location = await this.prisma.location.create({
        data: createLocationDto
      });

      return {
        status: 'success',
        message: 'Ubicación creada exitosamente',
        data: location
      };
    } catch (error) {
      console.error('Error en create location:', error);
      return {
        status: 'error',
        message: 'Error al crear la ubicación'
      };
    }
  }

  async findAll() {
    try {
      const locations = await this.prisma.location.findMany({
        orderBy: { name: 'asc' }
      });

      return {
        status: 'success',
        message: 'Ubicaciones obtenidas exitosamente',
        data: locations
      };
    } catch (error) {
      console.error('Error en findAll locations:', error);
      return {
        status: 'error',
        message: 'Error al obtener las ubicaciones'
      };
    }
  }

  async findByType(type: string) {
    try {
      const locations = await this.prisma.location.findMany({
        where: { type },
        orderBy: { name: 'asc' }
      });

      return {
        status: 'success',
        message: `Ubicaciones de tipo ${type} obtenidas exitosamente`,
        data: locations
      };
    } catch (error) {
      console.error('Error en findByType locations:', error);
      return {
        status: 'error',
        message: 'Error al obtener las ubicaciones por tipo'
      };
    }
  }

  async findOne(id: number) {
    try {
      const location = await this.prisma.location.findUnique({
        where: { id }
      });

      if (!location) {
        return {
          status: 'warning',
          message: 'Ubicación no encontrada'
        };
      }

      return {
        status: 'success',
        message: 'Ubicación encontrada',
        data: location
      };
    } catch (error) {
      console.error('Error en findOne location:', error);
      return {
        status: 'error',
        message: 'Error al obtener la ubicación'
      };
    }
  }

  async update(id: number, updateLocationDto: UpdateLocationDto) {
    try {
      const existingLocation = await this.prisma.location.findUnique({
        where: { id }
      });

      if (!existingLocation) {
        return {
          status: 'warning',
          message: 'Ubicación no encontrada'
        };
      }

      const location = await this.prisma.location.update({
        where: { id },
        data: updateLocationDto
      });

      return {
        status: 'success',
        message: 'Ubicación actualizada exitosamente',
        data: location
      };
    } catch (error) {
      console.error('Error en update location:', error);
      return {
        status: 'error',
        message: 'Error al actualizar la ubicación'
      };
    }
  }

  async remove(id: number) {
    try {
      const existingLocation = await this.prisma.location.findUnique({
        where: { id }
      });

      if (!existingLocation) {
        return {
          status: 'warning',
          message: 'Ubicación no encontrada'
        };
      }

      await this.prisma.location.delete({
        where: { id }
      });

      return {
        status: 'success',
        message: 'Ubicación eliminada exitosamente'
      };
    } catch (error) {
      console.error('Error en remove location:', error);
      return {
        status: 'error',
        message: 'Error al eliminar la ubicación'
      };
    }
  }
}
