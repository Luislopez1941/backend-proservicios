import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { GoogleMapsService, LocationData, PlaceSuggestion } from './google-maps.service';
import { CreateUserDto } from '../user/dto/create-user.dto';

@ApiTags('Google Maps')
@Controller('google-maps')
export class GoogleMapsController {
  constructor(private readonly googleMapsService: GoogleMapsService) {}

  @Get('geocode')
  @ApiOperation({ 
    summary: 'Geocodificar dirección', 
    description: 'Convierte una dirección en coordenadas usando Google Maps' 
  })
  @ApiQuery({ name: 'address', description: 'Dirección a geocodificar', example: 'Av. Tulum 456, Centro, Cancún, Q.R., México' })
  @ApiResponse({ 
    status: 200, 
    description: 'Coordenadas y datos de la dirección',
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
  async geocodeAddress(@Query('address') address: string): Promise<LocationData> {
    return this.googleMapsService.geocodeAddress(address);
  }
  
  @Post('geocode-address')
  @ApiOperation({ 
    summary: 'Geocodificar dirección', 
    description: 'Convierte una dirección en coordenadas usando Google Maps' 
  })
  @ApiBody({ type: CreateUserDto })
  async getAddress(@Body() createUserDto: CreateUserDto): Promise<LocationData> {
    return this.googleMapsService.geocodeAddress(createUserDto.location.address);
  }

  @Get('reverse-geocode')
  @ApiOperation({ 
    summary: 'Geocodificación inversa', 
    description: 'Convierte coordenadas en una dirección usando Google Maps' 
  })
  @ApiQuery({ name: 'lat', description: 'Latitud', example: 21.1619 })
  @ApiQuery({ name: 'lng', description: 'Longitud', example: -86.8515 })
  @ApiResponse({ 
    status: 200, 
    description: 'Dirección correspondiente a las coordenadas',
    type: String
  })
  async reverseGeocode(
    @Query('lat') lat: number,
    @Query('lng') lng: number
  ): Promise<string> {
    return this.googleMapsService.reverseGeocode(lat, lng);
  }

  @Get('search-address')
  @ApiOperation({ 
    summary: 'Buscar direcciones con sugerencias (GET)', 
    description: 'Busca direcciones y lugares con sugerencias como Google Maps. Perfecto para autocompletado de direcciones.' 
  })
  @ApiQuery({ name: 'query', description: 'Texto de búsqueda (ej: "Cancún", "Calle 123", "Plaza")', example: 'Cancún' })
  @ApiQuery({ name: 'lat', required: false, description: 'Latitud del centro de búsqueda (opcional)', example: 21.1619 })
  @ApiQuery({ name: 'lng', required: false, description: 'Longitud del centro de búsqueda (opcional)', example: -86.8515 })
  @ApiQuery({ name: 'country', required: false, description: 'País para filtrar resultados (ej: "México")', example: 'México' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de sugerencias de direcciones y lugares',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          place_id: { type: 'string', example: 'ChIJ8VQyqQqG1o8RqJzQzQzQzQzQ' },
          description: { type: 'string', example: 'Cancún, Quintana Roo, México' },
          main_text: { type: 'string', example: 'Cancún' },
          secondary_text: { type: 'string', example: 'Quintana Roo, México' },
          types: { type: 'array', items: { type: 'string' }, example: ['locality', 'political'] }
        }
      }
    }
  })
  async searchAddress(
    @Query('query') query: string,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
    @Query('country') country?: string,
  ): Promise<{data: any[], status: string, message: string}> {
    return this.googleMapsService.searchAddresses(query, lat, lng, country);
  }

  @Post('search-address')
  @ApiOperation({ 
    summary: 'Buscar direcciones con sugerencias (POST)', 
    description: 'Busca direcciones y lugares con sugerencias como Google Maps. Versión POST para frontend que prefiere enviar datos en el body.' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Texto de búsqueda (opcional)', example: 'Cancún' },
        location: { type: 'string', description: 'Texto de búsqueda (opcional, alternativa a query)', example: 'Cancún' },
        lat: { type: 'number', description: 'Latitud del centro de búsqueda (opcional)', example: 21.1619 },
        lng: { type: 'number', description: 'Longitud del centro de búsqueda (opcional)', example: -86.8515 },
        country: { type: 'string', description: 'País para filtrar resultados (opcional, por defecto México)', example: 'México' }
      },
      required: []
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de sugerencias de direcciones y lugares',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          place_id: { type: 'string', example: 'ChIJ8VQyqQqG1o8RqJzQzQzQzQzQ' },
          description: { type: 'string', example: 'Cancún, Quintana Roo, México' },
          main_text: { type: 'string', example: 'Cancún' },
          secondary_text: { type: 'string', example: 'Quintana Roo, México' },
          types: { type: 'array', items: { type: 'string' }, example: ['locality', 'political'] }
        }
      }
    }
  })
  async searchAddressPost(
    @Body() body: { query?: string; location?: string; lat?: number; lng?: number; country?: string }
  ): Promise<{data: any[], status: string, message: string}> {
    // Manejar tanto 'query' como 'location' del frontend
    const query = body.query || body.location;
    const { lat, lng, country } = body;
    
    if (!query) {
      return {data: [], status: 'warning', message: 'El término de búsqueda no puede estar vacío'};
    }
    
    return this.googleMapsService.searchAddresses(query, lat, lng, country);
  }

  @Get('autocomplete')
  @ApiOperation({ 
    summary: 'Autocompletado de lugares (endpoint original)', 
    description: 'Obtiene sugerencias de lugares para autocompletado' 
  })
  @ApiQuery({ name: 'input', description: 'Texto de búsqueda', example: 'Cancún' })
  @ApiQuery({ name: 'lat', required: false, description: 'Latitud del centro de búsqueda', example: 21.1619 })
  @ApiQuery({ name: 'lng', required: false, description: 'Longitud del centro de búsqueda', example: -86.8515 })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de sugerencias de lugares',
    type: [Object]
  })
  async autocompletePlaces(
    @Query('input') input: string,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ): Promise<PlaceSuggestion[]> {
    const location = (lat !== undefined && lng !== undefined) ? { lat, lng } : undefined;
    return this.googleMapsService.autocompletePlaces(input, location);
  }

  @Get('place-details')
  @ApiOperation({ 
    summary: 'Detalles de lugar', 
    description: 'Obtiene detalles completos de un lugar por su place_id' 
  })
  @ApiQuery({ name: 'place_id', description: 'ID del lugar en Google Maps', example: 'ChIJ8VQyqQqG1o8RqJzQzQzQzQzQ' })
  @ApiResponse({ 
    status: 200, 
    description: 'Detalles completos del lugar',
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
  async getPlaceDetails(@Query('place_id') placeId: string): Promise<LocationData> {
    return this.googleMapsService.getPlaceDetails(placeId);
  }

  @Get('distance')
  @ApiOperation({ 
    summary: 'Calcular distancia', 
    description: 'Calcula la distancia entre dos puntos en kilómetros' 
  })
  @ApiQuery({ name: 'lat1', description: 'Latitud del primer punto', example: 21.1619 })
  @ApiQuery({ name: 'lng1', description: 'Longitud del primer punto', example: -86.8515 })
  @ApiQuery({ name: 'lat2', description: 'Latitud del segundo punto', example: 20.9674 })
  @ApiQuery({ name: 'lng2', description: 'Longitud del segundo punto', example: -89.5926 })
  @ApiResponse({ 
    status: 200, 
    description: 'Distancia en kilómetros',
    type: Number
  })
  async calculateDistance(
    @Query('lat1') lat1: number,
    @Query('lng1') lng1: number,
    @Query('lat2') lat2: number,
    @Query('lng2') lng2: number,
  ): Promise<number> {
    return this.googleMapsService.calculateDistance(
      { lat: lat1, lng: lng1 },
      { lat: lat2, lng: lng2 }
    );
  }
}
