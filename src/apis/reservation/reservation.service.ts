import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReservationDto: CreateReservationDto) {
    try {
      // Validar que los usuarios existan
      const issuer = await this.prisma.user.findUnique({
        where: { id: createReservationDto.issuer_id }
      });

      if (!issuer) {
        throw new NotFoundException(`Usuario con ID ${createReservationDto.issuer_id} no encontrado`);
      }

      const receiver = await this.prisma.user.findUnique({
        where: { id: createReservationDto.receiver_id }
      });

      if (!receiver) {
        throw new NotFoundException(`Usuario con ID ${createReservationDto.receiver_id} no encontrado`);
      }

      // Validar que el receiver tenga el calendario habilitado
      if (!receiver.calendar_enabled) {
        throw new BadRequestException('El trabajador no tiene el calendario habilitado para recibir reservaciones');
      }

      // Validar que no sea el mismo usuario
      if (createReservationDto.issuer_id === createReservationDto.receiver_id) {
        throw new BadRequestException('No puedes hacer una reservación contigo mismo');
      }

      // Convertir la fecha string a DateTime
      const reservationDate = new Date(createReservationDto.date);

      // Validar que la fecha no sea en el pasado
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (reservationDate < now) {
        throw new BadRequestException('No puedes hacer una reservación en una fecha pasada');
      }

      // Validar formato de horas (HH:MM)
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(createReservationDto.start_time) || !timeRegex.test(createReservationDto.end_time)) {
        throw new BadRequestException('El formato de las horas debe ser HH:MM (ej: 09:00)');
      }

      // Validar que la hora de fin sea mayor que la de inicio
      const [startHour, startMinute] = createReservationDto.start_time.split(':').map(Number);
      const [endHour, endMinute] = createReservationDto.end_time.split(':').map(Number);
      
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;

      if (endTimeMinutes <= startTimeMinutes) {
        throw new BadRequestException('La hora de fin debe ser mayor que la hora de inicio');
      }

      // Crear la reservación
      const reservation = await this.prisma.reservation.create({
        data: {
          issuer_id: createReservationDto.issuer_id,
          receiver_id: createReservationDto.receiver_id,
          date: reservationDate,
          start_time: createReservationDto.start_time,
          end_time: createReservationDto.end_time,
          notes: createReservationDto.notes,
          status: 'pending',
        },
        include: {
          issuer: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              phone: true,
            }
          },
          receiver: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              email: true,
              phone: true,
            }
          }
        }
      });

      return {
        status: 'success',
        message: 'Reservación creada exitosamente',
        data: reservation
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error en create reservation:', error);
      throw new BadRequestException('Error al crear la reservación');
    }
  }

  findAll() {
    return `This action returns all reservation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} reservation`;
  }

  update(id: number, updateReservationDto: UpdateReservationDto) {
    return `This action updates a #${id} reservation`;
  }

  remove(id: number) {
    return `This action removes a #${id} reservation`;
  }
}
