import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ValidationPipe } from '@nestjs/common';
import { LocalitiesService } from './localities.service';
import { CreateLocalityDto } from './dto/create-locality.dto';
import { UpdateLocalityDto } from './dto/update-locality.dto';

@Controller('localities')
export class LocalitiesController {
  constructor(private readonly localitiesService: LocalitiesService) {}

  @Post()
  async create(@Body(ValidationPipe) createLocalityDto: CreateLocalityDto) {
    return this.localitiesService.create(createLocalityDto);
  }

  @Get('get-localities-by-municipality/:municipalityId')
  async findByMunicipality(@Param('municipalityId') municipalityId: string) {
    return this.localitiesService.findByMunicipality(+municipalityId);
  }

  @Get('get-localities')
  async findAll(@Query('stateId') stateId?: string, @Query('municipalityId') municipalityId?: string) {
    if (stateId) {
      return this.localitiesService.findByState(+stateId);
    }
    if (municipalityId) {
      return this.localitiesService.findByMunicipality(+municipalityId);
    }
    return this.localitiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.localitiesService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body(ValidationPipe) updateLocalityDto: UpdateLocalityDto) {
    return this.localitiesService.update(+id, updateLocalityDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.localitiesService.remove(+id);
  }
}
