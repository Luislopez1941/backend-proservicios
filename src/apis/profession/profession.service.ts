import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfessionDto } from './dto/create-profession.dto';
import { UpdateProfessionDto } from './dto/update-profession.dto';

@Injectable()
export class ProfessionService {
  constructor(private prisma: PrismaService) {}

  async create(createProfessionDto: CreateProfessionDto) {
    try {
      // Verificar si la profesión ya existe
      const existingProfession = await this.prisma.profession.findUnique({
        where: { name: createProfessionDto.name }
      });

      if (existingProfession) {
        return {
          status: 'warning',
          message: 'La profesión ya existe'
        };
      }

      const profession = await this.prisma.profession.create({
        data: createProfessionDto
      });

      return {
        status: 'success',
        message: 'Profesión creada exitosamente',
        data: profession
      };
    } catch (error) {
      console.error('Error en create profession:', error);
      return {
        status: 'error',
        message: 'Error al crear la profesión'
      };
    }
  }

  async findAll() {
    try {
      const professions = await this.prisma.profession.findMany({
        orderBy: { name: 'asc' }
      });

      return {
        status: 'success',
        message: 'Profesiones obtenidas exitosamente',
        data: professions
      };
    } catch (error) {
      console.error('Error en findAll professions:', error);
      return {
        status: 'error',
        message: 'Error al obtener las profesiones'
      };
    }
  }

  async findOne(id: number) {
    try {
      const profession = await this.prisma.profession.findUnique({
        where: { id }
      });

      if (!profession) {
        return {
          status: 'warning',
          message: 'Profesión no encontrada'
        };
      }

      return {
        status: 'success',
        message: 'Profesión encontrada',
        data: profession
      };
    } catch (error) {
      console.error('Error en findOne profession:', error);
      return {
        status: 'error',
        message: 'Error al obtener la profesión'
      };
    }
  }

  async update(id: number, updateProfessionDto: UpdateProfessionDto) {
    try {
      const existingProfession = await this.prisma.profession.findUnique({
        where: { id }
      });

      if (!existingProfession) {
        return {
          status: 'warning',
          message: 'Profesión no encontrada'
        };
      }

      // Si se está actualizando el nombre, verificar que no exista otra con el mismo nombre
      if (updateProfessionDto.name) {
        const duplicateProfession = await this.prisma.profession.findFirst({
          where: {
            name: updateProfessionDto.name,
            id: { not: id }
          }
        });

        if (duplicateProfession) {
          return {
            status: 'warning',
            message: 'Ya existe una profesión con ese nombre'
          };
        }
      }

      const profession = await this.prisma.profession.update({
        where: { id },
        data: updateProfessionDto
      });

      return {
        status: 'success',
        message: 'Profesión actualizada exitosamente',
        data: profession
      };
    } catch (error) {
      console.error('Error en update profession:', error);
      return {
        status: 'error',
        message: 'Error al actualizar la profesión'
      };
    }
  }

  async remove(id: number) {
    try {
      const existingProfession = await this.prisma.profession.findUnique({
        where: { id }
      });

      if (!existingProfession) {
        return {
          status: 'warning',
          message: 'Profesión no encontrada'
        };
      }

      await this.prisma.profession.delete({
        where: { id }
      });

      return {
        status: 'success',
        message: 'Profesión eliminada exitosamente'
      };
    } catch (error) {
      console.error('Error en remove profession:', error);
      return {
        status: 'error',
        message: 'Error al eliminar la profesión'
      };
    }
  }

  async searchProfessions(searchTerm: string) {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        return {
          status: 'warning',
          message: 'El término de búsqueda no puede estar vacío',
          data: []
        };
      }

      const professions = await this.prisma.profession.findMany({
        where: {
          name: {
            contains: searchTerm.trim(),
            mode: 'insensitive' // Búsqueda case-insensitive
          }
        },
        orderBy: { name: 'asc' }
      });

      return {
        status: 'success',
        message: 'Búsqueda realizada exitosamente',
        data: professions
      };
    } catch (error) {
      console.error('Error en searchProfessions:', error);
      return {
        status: 'error',
        message: 'Error en la búsqueda de profesiones',
        data: []
      };
    }
  }
}
