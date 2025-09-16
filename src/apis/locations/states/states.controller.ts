import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe } from '@nestjs/common';
import { StatesService } from './states.service';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';

@Controller('states')
export class StatesController {
  constructor(private readonly statesService: StatesService) {}

  @Post()
  async create(@Body(ValidationPipe) createStateDto: CreateStateDto) {
    return this.statesService.create(createStateDto);
  }

  @Get('get-states')
  async findAll() {
    return this.statesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.statesService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body(ValidationPipe) updateStateDto: UpdateStateDto) {
    return this.statesService.update(+id, updateStateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.statesService.remove(+id);
  }
}
