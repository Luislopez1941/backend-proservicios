import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@ApiTags('Reservaciones')
@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post('create')
  @ApiOperation({ summary: 'Crear reservación', description: 'Crea una nueva reservación entre un cliente y un trabajador' })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({ status: 201, description: 'Reservación creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  create(@Body(ValidationPipe) createReservationDto: CreateReservationDto) {
    return this.reservationService.create(createReservationDto);
  }

  @Get('get-by-user/:userId')
  @ApiOperation({ 
    summary: 'Obtener reservaciones por usuario', 
    description: 'Obtiene todas las reservaciones de un usuario (tanto las que hizo como las que recibió)' 
  })
  @ApiParam({ name: 'userId', description: 'ID del usuario', type: Number })
  @ApiResponse({ status: 200, description: 'Reservaciones obtenidas exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findByUserId(@Param('userId') userId: string) {
    return this.reservationService.findByUserId(+userId);
  }

 
}
