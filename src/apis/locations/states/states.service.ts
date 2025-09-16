import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';

@Injectable()
export class StatesService {
  constructor(private prisma: PrismaService) {}

  async create(createStateDto: CreateStateDto) {
    try {
      const state = await this.prisma.state.create({
        data: createStateDto,
        include: {
          municipalities: true,
          localities: true,
          users: true
        }
      });

      return {
        status: 'success',
        message: 'Estado creado exitosamente',
        data: state
      };
    } catch (error) {
      console.error('Error en create state:', error);
      return {
        status: 'error',
        message: 'Error al crear el estado'
      };
    }
  }

  async findAll() {
    try {
      const states = await this.prisma.state.findMany({
        include: {
          municipalities: {
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
              municipalities: true,
              localities: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return {
        status: 'success',
        message: 'Estados obtenidos exitosamente',
        data: states
      };
    } catch (error) {
      console.error('Error en findAll states:', error);
      return {
        status: 'error',
        message: 'Error al obtener los estados'
      };
    }
  }

  async findOne(id: number) {
    try {
      const state = await this.prisma.state.findUnique({
        where: { id },
        include: {
          municipalities: {
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
              municipalities: true,
              localities: true
            }
          }
        }
      });

      if (!state) {
        return {
          status: 'warning',
          message: 'Estado no encontrado'
        };
      }

      return {
        status: 'success',
        message: 'Estado encontrado',
        data: state
      };
    } catch (error) {
      console.error('Error en findOne state:', error);
      return {
        status: 'error',
        message: 'Error al obtener el estado'
      };
    }
  }

  async update(id: number, updateStateDto: UpdateStateDto) {
    try {
      const existingState = await this.prisma.state.findUnique({
        where: { id }
      });

      if (!existingState) {
        return {
          status: 'warning',
          message: 'Estado no encontrado'
        };
      }

      const state = await this.prisma.state.update({
        where: { id },
        data: updateStateDto,
        include: {
          municipalities: {
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
        message: 'Estado actualizado exitosamente',
        data: state
      };
    } catch (error) {
      console.error('Error en update state:', error);
      return {
        status: 'error',
        message: 'Error al actualizar el estado'
      };
    }
  }

  async remove(id: number) {
    try {
      const existingState = await this.prisma.state.findUnique({
        where: { id }
      });

      if (!existingState) {
        return {
          status: 'warning',
          message: 'Estado no encontrado'
        };
      }

      await this.prisma.state.delete({
        where: { id }
      });

      return {
        status: 'success',
        message: 'Estado eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error en remove state:', error);
      return {
        status: 'error',
        message: 'Error al eliminar el estado'
      };
    }
  }
}
