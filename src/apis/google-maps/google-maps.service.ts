import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@googlemaps/google-maps-services-js';

export interface LocationData {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id: string;
  formatted_address: string;
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

export interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types?: string[];
}

@Injectable()
export class GoogleMapsService {
  private readonly logger = new Logger(GoogleMapsService.name);
  private readonly client: Client;

  constructor(private configService: ConfigService) {
    this.client = new Client({});
  }

  /**
   * Convierte una dirección en coordenadas
   */
  async geocodeAddress(address: string): Promise<LocationData> {
    try {
      const apiKey = this.configService.get<string>('API_KEY_GOOGLE');
      if (!apiKey) {
        throw new Error('API_KEY_GOOGLE no está configurada');
      }

      const response = await this.client.geocode({
        params: {
          address,
          key: apiKey,
          region: 'mx', // Forzar búsqueda en México
        },
      });

      if (response.data.results.length === 0) {
        throw new Error('No se encontró la dirección');
      }

      const result = response.data.results[0];
      if (!result.geometry || !result.formatted_address || !result.place_id) {
        throw new Error('Datos de ubicación incompletos');
      }

      const location = result.geometry.location;

      return {
        address: result.formatted_address,
        coordinates: {
          lat: location.lat,
          lng: location.lng,
        },
        place_id: result.place_id,
        formatted_address: result.formatted_address,
        bounds: result.geometry.bounds ? {
          northeast: {
            lat: result.geometry.bounds.northeast.lat,
            lng: result.geometry.bounds.northeast.lng,
          },
          southwest: {
            lat: result.geometry.bounds.southwest.lat,
            lng: result.geometry.bounds.southwest.lng,
          },
        } : undefined,
      };
    } catch (error) {
      this.logger.error('Error en geocoding:', error);
      throw new Error('Error al geocodificar la dirección');
    }
  }

  /**
   * Convierte coordenadas en una dirección
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const apiKey = this.configService.get<string>('API_KEY_GOOGLE');
      if (!apiKey) {
        throw new Error('API_KEY_GOOGLE no está configurada');
      }

      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: apiKey,
        },
      });

      if (response.data.results.length === 0) {
        throw new Error('No se encontró la dirección para las coordenadas');
      }

      return response.data.results[0].formatted_address;
    } catch (error) {
      this.logger.error('Error en reverse geocoding:', error);
      throw new Error('Error al obtener la dirección');
    }
  }

  /**
   * Obtiene sugerencias de lugares para autocompletado
   */
  async autocompletePlaces(input: string, location?: { lat: number; lng: number }): Promise<PlaceSuggestion[]> {
    try {
      const apiKey = this.configService.get<string>('API_KEY_GOOGLE');
      if (!apiKey) {
        throw new Error('API_KEY_GOOGLE no está configurada');
      }

      const response = await this.client.placeAutocomplete({
        params: {
          input,
          key: apiKey,
          location: location ? `${location.lat},${location.lng}` : undefined,
          radius: location ? 50000 : undefined, // 50km si hay ubicación
          // region: 'mx', // Comentado temporalmente para evitar error de TypeScript
          // types: 'cities', // Comentado temporalmente para evitar error de TypeScript
        },
      });

      return response.data.predictions.map(prediction => ({
        place_id: prediction.place_id,
        description: prediction.description,
        structured_formatting: {
          main_text: prediction.structured_formatting.main_text,
          secondary_text: prediction.structured_formatting.secondary_text,
        },
        types: prediction.types || [],
      }));
    } catch (error) {
      this.logger.error('Error en autocompletado:', error);
      throw new Error('Error al obtener sugerencias de lugares');
    }
  }

  /**
   * Obtiene detalles de un lugar por su place_id
   */
  async getPlaceDetails(placeId: string): Promise<LocationData> {
    try {
      const apiKey = this.configService.get<string>('API_KEY_GOOGLE');
      if (!apiKey) {
        throw new Error('API_KEY_GOOGLE no está configurada');
      }

      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: apiKey,
          fields: ['formatted_address', 'geometry', 'place_id'],
        },
      });

      const result = response.data.result;
      if (!result.geometry || !result.formatted_address || !result.place_id) {
        throw new Error('Datos de ubicación incompletos');
      }

      const location = result.geometry.location;

      return {
        address: result.formatted_address,
        coordinates: {
          lat: location.lat,
          lng: location.lng,
        },
        place_id: result.place_id,
        formatted_address: result.formatted_address,
        bounds: result.geometry.bounds ? {
          northeast: {
            lat: result.geometry.bounds.northeast.lat,
            lng: result.geometry.bounds.northeast.lng,
          },
          southwest: {
            lat: result.geometry.bounds.southwest.lat,
            lng: result.geometry.bounds.southwest.lng,
          },
        } : undefined,
      };
    } catch (error) {
      this.logger.error('Error al obtener detalles del lugar:', error);
      throw new Error('Error al obtener detalles del lugar');
    }
  }

  /**
   * Busca direcciones con sugerencias (lógica del servicio)
   */
  async searchAddresses(query: string, lat?: number, lng?: number, country?: string): Promise<{data: any[], status: string, message: string}> {
    let pais = 'México';
    try {
      // Construir query con país si se especifica
      let searchQuery = query.trim();
      if (!searchQuery) {
        throw new Error('La consulta de búsqueda no puede estar vacía');
      }
      
      // Siempre agregar México al final para dirigir búsquedas a México
      const countryToUse = country || pais;
      
      // Primero intentar con sugerencias de ciudades mexicanas
      try {
        const mexicanSuggestions = await this.getMexicanCitySuggestions(query);
        if (mexicanSuggestions.data && mexicanSuggestions.data.length > 0) {
          return mexicanSuggestions;
        }
      } catch (error) {
        this.logger.log('Error en sugerencias mexicanas:', error.message);
      }

      // Intentar usar autocompletado de Google Maps
      try {
        const location = (lat !== undefined && lng !== undefined) ? { lat, lng } : undefined;
        const suggestions = await this.autocompletePlaces(query, location);
        
        if (suggestions.length > 0) {
          // Filtrar sugerencias que contengan México o sean de México
          const mexicoSuggestions = suggestions.filter(suggestion => 
            suggestion.description.toLowerCase().includes('méxico') || 
            suggestion.description.toLowerCase().includes('mexico') ||
            suggestion.description.toLowerCase().includes('mx')
          );
          
          // Si hay sugerencias de México, usarlas; si no, usar todas las sugerencias
          const finalSuggestions = mexicoSuggestions.length > 0 ? mexicoSuggestions : suggestions;
          
          // Formatear respuesta para mejor uso en frontend
          const result = finalSuggestions.map(suggestion => ({
            place_id: suggestion.place_id,
            description: suggestion.description,
            main_text: suggestion.structured_formatting.main_text,
            secondary_text: suggestion.structured_formatting.secondary_text,
            types: suggestion.types || []
          }));
          
          return {data: result, status: 'success', message: 'Sugerencias de direcciones encontradas'};
        }
      } catch (autocompleteError) {
        this.logger.log('Autocompletado falló, usando geocoding como fallback:', autocompleteError.message);
      }
      
      // Fallback: usar geocoding para generar una sugerencia
      try {
        const geocodeResult = await this.geocodeAddress(searchQuery);

        let result = [{
          place_id: geocodeResult.place_id,
          description: geocodeResult.formatted_address,
          main_text: query,
          secondary_text: geocodeResult.formatted_address.replace(query, '').trim(),
          types: ['geocode']
        }];
        
        return {data: result, status: 'success', message: 'Sugerencia de dirección generada correctamente'};
        } catch (geocodeError) {
          this.logger.error('Error en geocoding fallback:', geocodeError);
          return {data: [], status: 'error', message: 'Error al procesar la búsqueda de direcciones'};
        }
      } catch (error) {
        this.logger.error('Error en searchAddresses:', error);
        return {data: [], status: 'error', message: 'Error interno del servidor'};
      }
  }

  /**
   * Obtiene sugerencias específicas de ciudades mexicanas
   */
  async getMexicanCitySuggestions(query: string): Promise<{data: any[], status: string, message: string}> {
    try {
      const apiKey = this.configService.get<string>('API_KEY_GOOGLE');
      if (!apiKey) {
        throw new Error('API_KEY_GOOGLE no está configurada');
      }

      // Lista de ciudades mexicanas populares para sugerencias
      const mexicanCities = [
        'Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana',
        'León', 'Juárez', 'Torreón', 'Querétaro', 'San Luis Potosí',
        'Mérida', 'Mexicali', 'Aguascalientes', 'Acapulco', 'Cancún',
        'Saltillo', 'Hermosillo', 'Morelia', 'Villahermosa', 'Reynosa',
        'Tuxtla Gutiérrez', 'Toluca', 'Culiacán', 'Chihuahua', 'Durango',
        'Veracruz', 'Xalapa', 'Tampico', 'Mazatlán', 'Nuevo Laredo'
      ];

      // Filtrar ciudades que coincidan con la query
      const matchingCities = mexicanCities.filter(city => 
        city.toLowerCase().includes(query.toLowerCase())
      );

      // Si encontramos coincidencias, devolverlas formateadas
      if (matchingCities.length > 0) {
        const result = matchingCities.slice(0, 5).map(city => ({
          place_id: `mexico_${city.toLowerCase().replace(/\s+/g, '_')}`,
          description: `${city}, México`,
          main_text: city,
          secondary_text: 'México',
          types: ['locality', 'political']
        }));
        
        return {data: result, status: 'success', message: 'Sugerencias de ciudades mexicanas encontradas'};
      }

      return {data: [], status: 'warning', message: 'No se encontraron ciudades mexicanas que coincidan'};
    } catch (error) {
      this.logger.error('Error en getMexicanCitySuggestions:', error);
      return {data: [], status: 'error', message: 'Error al obtener sugerencias de ciudades mexicanas'};
    }
  }

  /**
   * Calcula la distancia entre dos puntos en kilómetros
   */
  calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLon = this.deg2rad(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(point1.lat)) *
        Math.cos(this.deg2rad(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
