import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ValidationPipe } from '@nestjs/common';
import { MunicipalitiesService } from './municipalities.service';
import { CreateMunicipalityDto } from './dto/create-municipality.dto';
import { UpdateMunicipalityDto } from './dto/update-municipality.dto';

@Controller('municipalities')
export class MunicipalitiesController {
  constructor(private readonly municipalitiesService: MunicipalitiesService) {}

  @Post()
  async create(@Body(ValidationPipe) createMunicipalityDto: CreateMunicipalityDto) {
    return this.municipalitiesService.create(createMunicipalityDto);
  }

  @Get('get-municipalities-by-state/:stateId')
  async findByState(@Param('stateId') stateId: string) {
    return this.municipalitiesService.findByState(+stateId);
  }

  @Get('get-municipalities')
  async findAll(@Query('stateId') stateId?: string) {
    if (stateId) {
      return this.municipalitiesService.findByState(+stateId);
    }
    return this.municipalitiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.municipalitiesService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body(ValidationPipe) updateMunicipalityDto: UpdateMunicipalityDto) {
    return this.municipalitiesService.update(+id, updateMunicipalityDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.municipalitiesService.remove(+id);
  }
}
