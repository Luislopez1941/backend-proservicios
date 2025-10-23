import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { SearchJobsByLocationDto } from './dto/search-jobs-location.dto';
import { SearchJobsByProfessionDto } from './dto/search-jobs-profession.dto';

@ApiTags('Trabajos')
@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post('create')
  @ApiOperation({ summary: 'Crear trabajo', description: 'Crea un nuevo trabajo en el sistema' })
  @ApiBody({ type: CreateJobDto })
  @ApiResponse({ status: 201, description: 'Trabajo creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createJobDto: CreateJobDto) {
    return this.jobService.create(createJobDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los trabajos', description: 'Obtiene una lista de todos los trabajos' })
  @ApiResponse({ status: 200, description: 'Lista de trabajos obtenida exitosamente' })
  findAll() {
    return this.jobService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener trabajos por usuario', description: 'Obtiene todos los trabajos de un usuario específico' })
  @ApiResponse({ status: 200, description: 'Trabajos del usuario obtenidos exitosamente' })
  findByUser(@Param('userId') userId: string) {
    return this.jobService.findByUser(+userId);
  }

  @Get('category')
  @ApiOperation({ summary: 'Obtener trabajos por categoría', description: 'Obtiene trabajos filtrados por categoría' })
  @ApiQuery({ name: 'category', description: 'Categoría a filtrar', required: true })
  @ApiResponse({ status: 200, description: 'Trabajos por categoría obtenidos exitosamente' })
  findByCategory(@Query('category') category: string) {
    return this.jobService.findByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener trabajo por ID', description: 'Obtiene un trabajo específico por su ID' })
  @ApiResponse({ status: 200, description: 'Trabajo obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Trabajo no encontrado' })
  findOne(@Param('id') id: string) {
    return this.jobService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar trabajo', description: 'Actualiza un trabajo existente' })
  @ApiBody({ type: UpdateJobDto })
  @ApiResponse({ status: 200, description: 'Trabajo actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Trabajo no encontrado' })
  update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto) {
    return this.jobService.update(+id, updateJobDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar trabajo', description: 'Elimina un trabajo existente' })
  @ApiResponse({ status: 200, description: 'Trabajo eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Trabajo no encontrado' })
  remove(@Param('id') id: string) {
    return this.jobService.remove(+id);
  }

  @Post('search/location')
  @ApiOperation({ summary: 'Buscar trabajos por ubicación', description: 'Busca trabajos filtrados por criterios de ubicación usando POST' })
  @ApiBody({ type: SearchJobsByLocationDto })
  @ApiResponse({ status: 200, description: 'Trabajos filtrados por ubicación obtenidos exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  searchByLocation(@Body() searchParams: SearchJobsByLocationDto) {
    return this.jobService.searchJobsByLocation(searchParams);
  }

  @Post('search/profession')
  @ApiOperation({ summary: 'Buscar trabajos por profesión', description: 'Busca trabajos filtrados por criterios de profesión usando POST' })
  @ApiBody({ type: SearchJobsByProfessionDto })
  @ApiResponse({ status: 200, description: 'Trabajos filtrados por profesión obtenidos exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  searchByProfession(@Body() searchParams: SearchJobsByProfessionDto) {
    return this.jobService.searchJobsByProfession(searchParams);
  }
}
