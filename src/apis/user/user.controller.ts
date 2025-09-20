import { Controller, Get, Post, Body, Patch, Put, Param, Delete, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchCustomersDto } from './dto/search-customers.dto';
import { SearchCustomersPostDto } from './dto/search-customers-post.dto';
import { GoogleMapsService } from '../google-maps/google-maps.service';
import { AddressValidationService } from '../validation/address-validation.service';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Usuarios')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly googleMapsService: GoogleMapsService,
    private readonly addressValidation: AddressValidationService
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Crear usuario', description: 'Crea un nuevo usuario en el sistema' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body(ValidationPipe) createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios', description: 'Obtiene la lista de todos los usuarios' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida exitosamente' })
  findAll() {
    return this.userService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar clientes', description: 'Busca clientes por diferentes criterios' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'query', required: false, description: 'Término de búsqueda' })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda', type: UserResponseDto })
  async searchCustomers(@Query(ValidationPipe) searchParams: SearchCustomersDto): Promise<UserResponseDto> {
    return this.userService.searchCustomers(searchParams);
  }

  @Post('search')
  @ApiOperation({ summary: 'Buscar clientes (POST)', description: 'Busca clientes por diferentes criterios usando POST con FormData' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda', type: UserResponseDto })
  async searchCustomersPost(@Body(ValidationPipe) searchParams: SearchCustomersPostDto): Promise<UserResponseDto> {
    return this.userService.searchCustomersPost(searchParams);
  }

  @Get('get-user/:type/:id')
  @ApiOperation({ summary: 'Obtener usuario por tipo e ID', description: 'Obtiene un usuario específico por tipo e ID' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('type') type: string, @Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.getUserById(+id);
  }

  @Patch('update/:type/:id')
  @ApiOperation({ summary: 'Actualizar usuario (PATCH)', description: 'Actualiza los datos de un usuario existente usando PATCH' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async update(@Param('type') type: string, @Param('id') id: string, @Body(ValidationPipe) updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.userService.updateUser(+id, updateUserDto);
  }

  @Put('update/:type/:id')
  @ApiOperation({ summary: 'Actualizar usuario (PUT)', description: 'Actualiza los datos de un usuario existente usando PUT' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updatePut(@Param('type') type: string, @Param('id') id: string, @Body(ValidationPipe) updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.userService.updateUser(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario', description: 'Elimina un usuario del sistema' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  @Get('location/suggestions')
  @ApiOperation({ 
    summary: 'Obtener sugerencias de ubicación', 
    description: 'Obtiene sugerencias de autocompletado para ubicaciones usando Google Maps' 
  })
  @ApiQuery({ name: 'input', description: 'Texto de búsqueda', example: 'Cancún, Quintana Roo' })
  @ApiQuery({ name: 'lat', required: false, description: 'Latitud del usuario', example: 21.1619 })
  @ApiQuery({ name: 'lng', required: false, description: 'Longitud del usuario', example: -86.8515 })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de sugerencias de ubicación',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          place_id: { type: 'string', example: 'ChIJ8VQyqQqG1o8RqJzQzQzQzQzQ' },
          description: { type: 'string', example: 'Cancún, Quintana Roo, México' },
          structured_formatting: {
            type: 'object',
            properties: {
              main_text: { type: 'string', example: 'Cancún' },
              secondary_text: { type: 'string', example: 'Quintana Roo, México' }
            }
          }
        }
      }
    }
  })
  async getLocationSuggestions(
    @Query('input') input: string,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    try {
      const userLocation = lat && lng ? { lat, lng } : undefined;
      return await this.googleMapsService.autocompletePlaces(input, userLocation);
    } catch (error) {
      return {
        status: 'error',
        message: 'Error al obtener sugerencias de ubicación'
      };
    }
  }

  @Get('location/validate')
  @ApiOperation({ 
    summary: 'Validar dirección', 
    description: 'Valida una dirección usando Google Maps y retorna las coordenadas' 
  })
  @ApiQuery({ name: 'address', description: 'Dirección a validar', example: 'Av. Tulum 456, Centro, Cancún, Q.R., México' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dirección validada con coordenadas',
    schema: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        coordinates: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' }
          }
        },
        place_id: { type: 'string' },
        formatted_address: { type: 'string' }
      }
    }
  })
  async validateAddress(@Query('address') address: string) {
    try {
      return await this.googleMapsService.geocodeAddress(address);
    } catch (error) {
      return {
        status: 'error',
        message: 'No se pudo validar la dirección proporcionada'
      };
    }
  }

  @Get('address/check')
  @ApiOperation({ 
    summary: 'Verificar dirección antes del registro', 
    description: 'Valida una dirección y proporciona sugerencias de mejora' 
  })
  @ApiQuery({ name: 'address', description: 'Dirección a verificar', example: 'Calle 123, Centro, Cancún' })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado de la validación',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        cleanAddress: { type: 'string' },
        suggestions: { type: 'array', items: { type: 'string' } },
        errors: { type: 'array', items: { type: 'string' } },
        isSuspicious: { type: 'boolean' },
        suspiciousReasons: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  async checkAddress(@Query('address') address: string) {
    try {
      // Validación básica
      const validationResult = this.addressValidation.validateAddressInput(address);
      
      // Detección de direcciones sospechosas
      const suspiciousCheck = this.addressValidation.detectSuspiciousAddress(address);
      
      // Sugerencias de mejora
      const improvements = this.addressValidation.suggestAddressImprovements(address);
      
      return {
        isValid: validationResult.isValid && !suspiciousCheck.isSuspicious,
        cleanAddress: validationResult.cleanAddress,
        suggestions: [...validationResult.suggestions, ...improvements],
        errors: validationResult.errors,
        isSuspicious: suspiciousCheck.isSuspicious,
        suspiciousReasons: suspiciousCheck.reasons
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Error al verificar la dirección'
      };
    }
  }

  @Get('config/check')
  @ApiOperation({ 
    summary: 'Verificar configuración de Google Maps', 
    description: 'Verifica si la API Key de Google Maps está configurada correctamente' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado de la configuración',
    schema: {
      type: 'object',
      properties: {
        hasApiKey: { type: 'boolean' },
        apiKeyLength: { type: 'number' },
        message: { type: 'string' }
      }
    }
  })
  async checkConfig() {
    try {
      const apiKey = process.env.API_KEY_GOOGLE;
      const hasApiKey = !!apiKey;
      const apiKeyLength = apiKey ? apiKey.length : 0;
      
      return {
        hasApiKey,
        apiKeyLength,
        message: hasApiKey 
          ? `API Key configurada correctamente (${apiKeyLength} caracteres)`
          : 'API Key no encontrada. Verifica la variable API_KEY_GOOGLE en tu archivo .env'
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Error al verificar la configuración'
      };
    }
  }

 

  @Get('raw/:id')
  @ApiOperation({ summary: 'Usuario raw', description: 'Obtiene el usuario sin procesar para debug' })
  async rawUser(@Param('id') id: string) {
    return this.userService.rawUser(+id);
  }

  
}
