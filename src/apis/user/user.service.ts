import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchCustomersDto } from './dto/search-customers.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      // Verificar si el correo ya existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email }
      });

      if (existingUser) {
        return {
          status: 'warning',
          message: 'El correo ya se encuentra registrado'
        };
      }

      // Encriptar la contraseña antes de crear el usuario
      if (!createUserDto.password) {
        return {
          status: 'warning',
          message: 'La contraseña es requerida'
        };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

      // Preparar los datos para crear el usuario
      const { id_state, id_municipality, id_locality, professions, acceptTerms, ...userData } = createUserDto;

      // Crear el usuario
      const user = await this.prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          // Manejar las relaciones correctamente
          ...(id_state && { state: { connect: { id: id_state } } }),
          ...(id_municipality && { municipality: { connect: { id: id_municipality } } }),
          ...(id_locality && { locality: { connect: { id: id_locality } } }),
          // Guardar professions como JSON
          ...(professions && { professions: professions }),
        },
        select: {
          id: true,
          first_name: true,
          second_name: true,
          first_surname: true,
          second_last_name: true,
          email: true,
          phone: true,
          type_user: true,
          verified: true,
        }
      });

      return {
        status: 'success',
        message: 'Usuario creado exitosamente',
        data: user
      };
    } catch (error) {
      console.error('Error en createUser:', error);
      return {
        status: 'error',
        message: 'Error al crear el usuario'
      };
    }
  }

  async getUserById(id: number): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          first_name: true,
          second_name: true,
          first_surname: true,
          second_last_name: true,
          email: true,
          phone: true,
          description: true,
          gender: true,
          type_user: true,
          verified: true,
          reviewsCount: true,
          rating: true,
          birthdate: true,
          dni: true,
          state: {
            select: { id: true, name: true }
          },
          municipality: {
            select: { id: true, name: true }
          }
        }
      });

      if (!user) {
        return {
          status: 'warning',
          message: 'Usuario no encontrado'
        };
      }

      return {
        status: 'success',
        message: 'Usuario encontrado',
        data: user
      };
    } catch (error) {
      console.error('Error en getUserById:', error);
      return {
        status: 'error',
        message: 'Error al obtener el usuario'
      };
    }
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      // Buscar el usuario
      const existingUser = await this.prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return {
          status: 'warning',
          message: 'Usuario no encontrado'
        };
      }

      // Preparar los datos para actualizar el usuario
      const { id_state, id_municipality, id_locality, professions, acceptTerms, ...userData } = updateUserDto;

      // Si se está actualizando la contraseña, encriptarla
      let updateData = { ...userData };
      if (updateUserDto.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateUserDto.password, salt);
      }

      // Preparar las relaciones para la actualización
      const relationData: any = {};
      if (id_state !== undefined) {
        relationData.state = id_state ? { connect: { id: id_state } } : { disconnect: true };
      }
      if (id_municipality !== undefined) {
        relationData.municipality = id_municipality ? { connect: { id: id_municipality } } : { disconnect: true };
      }
      if (id_locality !== undefined) {
        relationData.locality = id_locality ? { connect: { id: id_locality } } : { disconnect: true };
      }
      if (professions !== undefined) {
        relationData.professions = professions;
      }

      // Actualizar el usuario
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...updateData,
          ...relationData,
        },
        select: {
          id: true,
          first_name: true,
          second_name: true,
          first_surname: true,
          second_last_name: true,
          email: true,
          phone: true,
          type_user: true,
          verified: true,
        }
      });

      return {
        status: 'success',
        message: 'Usuario actualizado exitosamente',
        data: user
      };
    } catch (error) {
      console.error('Error en updateUser:', error);
      return {
        status: 'error',
        message: 'Error al actualizar el usuario'
      };
    }
  }

  async searchCustomers(searchParams: SearchCustomersDto): Promise<UserResponseDto> {
    try {
      const { type_service, type_location, page = 1 } = searchParams;
      const pageSize = 2;
      const offset = (page - 1) * pageSize;

      console.log('Datos recibidos en servicio:', searchParams);

      let whereCondition: any = {};

      // Verificar si type_location existe y tiene las propiedades necesarias
      if (type_location?.id_location) {
        if (type_location.type === 'state') {
          whereCondition.state = { id: type_location.id_location };
        } else if (type_location.type === 'municipality') {
          whereCondition.municipality = { id: type_location.id_location };
        }
        
        console.log('Condición de búsqueda:', whereCondition);
      }

      // Agregar condición para profesiones si existe type_service
      if (type_service) {
        whereCondition.professions = {
          path: '$[*].id',
          array_contains: type_service
        };
      }

      console.log('Consulta final:', whereCondition);

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: whereCondition,
          skip: offset,
          take: pageSize,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            first_name: true,
            second_name: true,
            first_surname: true,
            second_last_name: true,
            email: true,
            phone: true,
            description: true,
            type_user: true,
            verified: true,
            reviewsCount: true,
            rating: true,
            professions: true,
            workPhotos: true,
            state: {
              select: { id: true, name: true }
            },
            municipality: {
              select: { id: true, name: true }
            }
          }
        }),
        this.prisma.user.count({
          where: whereCondition
        })
      ]);

      console.log('Usuarios encontrados:', users.length);
      console.log('Total de registros:', total);

      const totalPages = Math.ceil(total / pageSize);
      const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

      if (!users.length) {
        return {
          status: 'warning',
          message: 'No se encontraron usuarios',
          totalPages: [],
          currentPage: page,
          pageSize: pageSize
        };
      }

      return {
        status: 'success',
        message: 'Usuarios encontrados',
        data: users,
        totalPages: pageNumbers,
        currentPage: page,
        pageSize: pageSize,
        total: total
      };

    } catch (error) {
      console.error('Error en la consulta:', error);
      return {
        status: 'error',
        message: 'Error al buscar usuarios'
      };
    }
  }

  // Métodos adicionales para mantener compatibilidad
  create(createUserDto: CreateUserDto) {
    return this.createUser(createUserDto);
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return this.getUserById(id);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.updateUser(id, updateUserDto);
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
