import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleMapsService, LocationData } from '../google-maps/google-maps.service';

export interface SearchFilters {
  query?: string;
  location?: {
    address?: string;
    coordinates?: { lat: number; lng: number };
    radius?: number; // en km
  };
  category?: string;
  price_range?: { min: number; max: number };
  rating?: number;
  availability?: string; // ISO date
}

export interface ProfessionalSearchResult {
  id: number;
  email: string;
  first_name: string;
  first_surname: string;
  type_user: string;
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
    place_id: string;
  };
  distance?: number; // km desde la ubicación de búsqueda
  services?: any[];
  rating?: number;
}

export interface SearchResult {
  professionals: ProfessionalSearchResult[];
  total: number;
  search_center?: LocationData;
  search_radius?: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private prisma: PrismaService,
    private googleMaps: GoogleMapsService,
  ) {}

  /**
   * Busca profesionales por ubicación y filtros
   */
  async searchProfessionals(filters: SearchFilters): Promise<SearchResult> {
    try {
      let searchCenter: LocationData | undefined;
      let searchRadius = filters.location?.radius || 10; // 10km por defecto

      // Si hay ubicación, geocodificarla
      if (filters.location?.address) {
        searchCenter = await this.googleMaps.geocodeAddress(filters.location.address);
      } else if (filters.location?.coordinates) {
        const address = await this.googleMaps.reverseGeocode(
          filters.location.coordinates.lat,
          filters.location.coordinates.lng
        );
        searchCenter = await this.googleMaps.geocodeAddress(address);
      }

      // Construir query de Prisma
      const whereClause: any = {
        type_user: 'professional', // Solo profesionales
      };

      // Filtro por categoría si existe
      if (filters.category) {
        whereClause.services = {
          some: {
            category: {
              contains: filters.category,
              mode: 'insensitive',
            },
          },
        };
      }

      // Filtro por rating si existe
      if (filters.rating) {
        whereClause.rating = {
          gte: filters.rating,
        };
      }

      // Obtener profesionales de la base de datos
      const professionals = await this.prisma.user.findMany({
        where: whereClause,
      });

      // Si hay ubicación, filtrar por distancia
      let filteredProfessionals = professionals;
      if (searchCenter) {
        filteredProfessionals = professionals
          .map(prof => ({
            ...prof,
            distance: this.googleMaps.calculateDistance(
              searchCenter!.coordinates,
              {
                lat: prof.location_lat || 0,
                lng: prof.location_lng || 0,
              }
            ),
          }))
          .filter(prof => prof.distance <= searchRadius)
          .sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      // Formatear resultados
      const results: ProfessionalSearchResult[] = filteredProfessionals.map(prof => ({
        id: prof.id,
        email: prof.email,
        first_name: prof.first_name,
        first_surname: prof.first_surname,
        type_user: prof.type_user || 'worker',
        location: {
          address: prof.location_address || '',
          coordinates: {
            lat: prof.location_lat || 0,
            lng: prof.location_lng || 0,
          },
          place_id: prof.location_place_id || '',
        },
        distance: (prof as any).distance,
        services: Array.isArray(prof.professions) ? prof.professions : [],
        rating: prof.rating || 0,
      }));

      return {
        professionals: results,
        total: results.length,
        search_center: searchCenter,
        search_radius: searchRadius,
      };
    } catch (error) {
      this.logger.error('Error en búsqueda de profesionales:', error);
      throw new Error('Error al buscar profesionales');
    }
  }

  /**
   * Obtiene sugerencias de autocompletado para ubicaciones
   */
  async getLocationSuggestions(input: string, userLocation?: { lat: number; lng: number }) {
    try {
      return await this.googleMaps.autocompletePlaces(input, userLocation);
    } catch (error) {
      this.logger.error('Error al obtener sugerencias de ubicación:', error);
      throw new Error('Error al obtener sugerencias de ubicación');
    }
  }

  /**
   * Obtiene categorías de servicios disponibles
   */
  async getServiceCategories(): Promise<string[]> {
    try {
      // Por ahora retornamos categorías hardcodeadas
      // En el futuro se pueden obtener de una tabla de servicios
      return [
        'Plomería',
        'Electricidad',
        'Carpintería',
        'Pintura',
        'Jardinería',
        'Mecánica',
        'Cerrajería',
        'Soldadura',
        'Aires Acondicionados',
        'Limpieza',
        'Cocina',
        'Costura',
        'Peluquería',
        'Masajes',
        'Computación',
        'Fotografía',
        'Diseño Gráfico',
        'Enseñanza',
        'Entrenamiento'
      ];
    } catch (error) {
      this.logger.error('Error al obtener categorías:', error);
      return [];
    }
  }
}
