import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ValidationPipe } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  async create(@Body(ValidationPipe) createLocationDto: CreateLocationDto) {
    return this.locationsService.create(createLocationDto);
  }

  @Get()
  async findAll(@Query('type') type?: string) {
    if (type) {
      return this.locationsService.findByType(type);
    }
    return this.locationsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.locationsService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body(ValidationPipe) updateLocationDto: UpdateLocationDto) {
    return this.locationsService.update(+id, updateLocationDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.locationsService.remove(+id);
  }
}
