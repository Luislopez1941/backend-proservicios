import { Controller, Get, Post, Body, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { SearchService, SearchFilters, SearchResult } from './search.service';

@ApiTags('Búsqueda')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('professionals')
  @ApiOperation({ 
    summary: 'Buscar profesionales', 
    description: 'Busca profesionales por ubicación, categoría y otros filtros' 
  })
  @ApiBody({ 
    description: 'Filtros de búsqueda',
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string', example: 'plomero' },
        location: {
          type: 'object',
          properties: {
            address: { type: 'string', example: 'Ciudad de México' },
            coordinates: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: 19.4326 },
                lng: { type: 'number', example: -99.1332 }
              }
            },
            radius: { type: 'number', example: 10 }
          }
        },
        category: { type: 'string', example: 'plomería' },
        price_range: {
          type: 'object',
          properties: {
            min: { type: 'number', example: 100 },
            max: { type: 'number', example: 500 }
          }
        },
        rating: { type: 'number', example: 4.0 }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de profesionales encontrados',
    schema: {
      type: 'object',
      properties: {
        professionals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              email: { type: 'string' },
              first_name: { type: 'string' },
              first_surname: { type: 'string' },
              type_user: { type: 'string' },
              location: {
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
                  place_id: { type: 'string' }
                }
              },
              distance: { type: 'number' },
              rating: { type: 'number' }
            }
          }
        },
        total: { type: 'number' },
        search_center: { type: 'object' },
        search_radius: { type: 'number' }
      }
    }
  })
  async searchProfessionals(@Body(ValidationPipe) filters: SearchFilters): Promise<SearchResult> {
    return this.searchService.searchProfessionals(filters);
  }

  @Get('locations/suggestions')
  @ApiOperation({ 
    summary: 'Obtener sugerencias de ubicación', 
    description: 'Obtiene sugerencias de autocompletado para ubicaciones' 
  })
  @ApiQuery({ name: 'input', description: 'Texto de búsqueda', example: 'Ciudad de México' })
  @ApiQuery({ name: 'lat', required: false, description: 'Latitud del usuario', example: 19.4326 })
  @ApiQuery({ name: 'lng', required: false, description: 'Longitud del usuario', example: -99.1332 })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de sugerencias de ubicación',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          place_id: { type: 'string' },
          description: { type: 'string' },
          structured_formatting: {
            type: 'object',
            properties: {
              main_text: { type: 'string' },
              secondary_text: { type: 'string' }
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
    const userLocation = lat && lng ? { lat, lng } : undefined;
    return this.searchService.getLocationSuggestions(input, userLocation);
  }

  @Get('categories')
  @ApiOperation({ 
    summary: 'Obtener categorías de servicios', 
    description: 'Obtiene todas las categorías de servicios disponibles' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de categorías',
    schema: {
      type: 'array',
      items: { type: 'string' }
    }
  })
  async getServiceCategories() {
    return this.searchService.getServiceCategories();
  }
}
