import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchCustomersDto } from './dto/search-customers.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  async create(@Body(ValidationPipe) createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('search')
  async searchCustomers(@Query(ValidationPipe) searchParams: SearchCustomersDto): Promise<UserResponseDto> {
    return this.userService.searchCustomers(searchParams);
  }

  @Get('get-user/:type/:id')
  async findOne(@Param('type') type: string, @Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.getUserById(+id);
  }

  @Patch('update/:type/:id')
  async update(@Param('type') type: string, @Param('id') id: string, @Body(ValidationPipe) updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.userService.updateUser(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
