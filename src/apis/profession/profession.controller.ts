import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe } from '@nestjs/common';
import { ProfessionService } from './profession.service';
import { CreateProfessionDto } from './dto/create-profession.dto';
import { UpdateProfessionDto } from './dto/update-profession.dto';

@Controller('profession')
export class ProfessionController {
  constructor(private readonly professionService: ProfessionService) {}

  @Post()
  async create(@Body(ValidationPipe) createProfessionDto: CreateProfessionDto) {
    return this.professionService.create(createProfessionDto);
  }

  @Get('get-professions')
  async findAll() {
    return this.professionService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.professionService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body(ValidationPipe) updateProfessionDto: UpdateProfessionDto) {
    return this.professionService.update(+id, updateProfessionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.professionService.remove(+id);
  }
}
