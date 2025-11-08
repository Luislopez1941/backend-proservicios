import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchCustomersDto } from './dto/search-customers.dto';
import { SearchCustomersPostDto } from './dto/search-customers-post.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { GoogleMapsService } from '../google-maps/google-maps.service';
import { AddressValidationService } from '../validation/address-validation.service';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { StructuredLocationDto } from './dto/structured-location.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private googleMaps: GoogleMapsService,
    private addressValidation: AddressValidationService,
    private supabaseStorage: SupabaseStorageService
  ) {}

  /**
   * Normaliza el campo professions para asegurar que siempre sea un array plano
   * Maneja casos donde Prisma devuelve arrays anidados como [[]]
   */
  private normalizeProfessions(professions: any): any[] {
    console.log('🔧 normalizeProfessions llamado con:', {
      professions: JSON.stringify(professions),
      type: typeof professions,
      isArray: Array.isArray(professions),
      isNull: professions === null,
      isUndefined: professions === undefined
    });
    
    if (professions === null || professions === undefined) {
      console.log('🔧 normalizeProfessions: professions es null/undefined, retornando []');
      return [];
    }
    
    // Si es un array
    if (Array.isArray(professions)) {
      // Si el primer elemento es un array (caso [[]])
      if (professions.length > 0 && Array.isArray(professions[0])) {
        console.log('🔧 normalizeProfessions: detectado array anidado, extrayendo primer elemento');
        // Devolver el primer array si tiene contenido, o array vacío
        const result = professions[0].length > 0 ? professions[0] : [];
        console.log('🔧 normalizeProfessions: resultado de array anidado:', JSON.stringify(result));
        return result;
      }
      // Si es un array normal, devolverlo tal cual
      console.log('🔧 normalizeProfessions: array normal, retornando tal cual:', JSON.stringify(professions));
      return professions;
    }
    
    // Si no es un array, devolver array vacío
    console.log('🔧 normalizeProfessions: no es array, retornando []');
    return [];
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      // Verificar si el correo ya existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email }
      });

      if (existingUser) {
        return {
          status: 'warning',
          message: 'El correo ya se encuentra registrado'
        };
      }

      // Encriptar la contraseña antes de crear el usuario
      if (!createUserDto.password) {
        return {
          status: 'warning',
          message: 'La contraseña es requerida'
        };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

      // Validar y geocodificar la ubicación usando Google Maps
      let locationData: any;
      let structuredLocation: StructuredLocationDto | null = null;
      try {
        // Validación robusta de la dirección
        const validationResult = this.addressValidation.validateAddressInput(createUserDto.location.address);
        
        if (!validationResult.isValid) {
          const errorMessage = validationResult.errors.join('. ');
          const suggestions = validationResult.suggestions.length > 0 
            ? ` Sugerencias: ${validationResult.suggestions.join(', ')}`
            : '';
          
          return {
            status: 'warning',
            message: `${errorMessage}.${suggestions}`
          };
        }

        // Detectar direcciones sospechosas
        const suspiciousCheck = this.addressValidation.detectSuspiciousAddress(validationResult.cleanAddress);
        if (suspiciousCheck.isSuspicious) {
          return {
            status: 'warning',
            message: `Dirección sospechosa detectada: ${suspiciousCheck.reasons.join(', ')}. Por favor, usa una dirección real.`
          };
        }

        const cleanAddress = validationResult.cleanAddress;

        // Construir dirección completa con México al final para evitar ambigüedades
        const fullAddress = this.buildCompleteAddress(cleanAddress, createUserDto.location);

        // Siempre geocodificar la dirección para generar place_id automáticamente
        locationData = await this.googleMaps.geocodeAddress(fullAddress);

        // Validar coordenadas geográficas
        const coordValidation = this.addressValidation.validateCoordinates(
          locationData.coordinates.lat, 
          locationData.coordinates.lng,
          createUserDto.location.pais
        );
        
        if (!coordValidation.isValid) {
          return {
            status: 'warning',
            message: `Coordenadas inválidas: ${coordValidation.errors.join(', ')}`
          };
        }

        // Parsear la ubicación estructurada
        structuredLocation = this.parseStructuredLocation(locationData.address, createUserDto.location);

      } catch (error) {
        console.error('Error en validación de dirección:', error);
        
        // Mensajes específicos según el tipo de error
        if (error.message.includes('No se encontró')) {
          return {
            status: 'warning',
            message: 'No se encontró la dirección. Intenta con una dirección más específica (ej: "Calle 123, Colonia Centro, Ciudad")'
          };
        } else if (error.message.includes('API_KEY')) {
          return {
            status: 'error',
            message: 'Error de configuración del sistema. Contacta al administrador.'
          };
        } else {
          return {
            status: 'warning',
            message: 'La dirección no es válida. Verifica que esté escrita correctamente y sea una dirección real.'
          };
        }
      }

      // Preparar los datos para crear el usuario
      const { location, professions, acceptTerms, ...userData } = createUserDto;

      // Validar que tenemos los datos de ubicación necesarios
      if (!locationData || !structuredLocation) {
        console.error('❌ Datos de ubicación faltantes:', { locationData: !!locationData, structuredLocation: !!structuredLocation });
        return {
          status: 'error',
          message: 'Error al procesar la ubicación del usuario'
        };
      }

      // Crear el usuario
      const user = await this.prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          // Datos de ubicación de Google Maps (compatibilidad)
          location_address: locationData.address,
          location_lat: locationData.coordinates.lat,
          location_lng: locationData.coordinates.lng,
          location_place_id: locationData.place_id,
          location_bounds: locationData.bounds,
          // Datos de ubicación estructurada
          location_street: (structuredLocation as StructuredLocationDto).street,
          location_colony: (structuredLocation as StructuredLocationDto).colony,
          location_city: (structuredLocation as StructuredLocationDto).city,
          location_state: (structuredLocation as StructuredLocationDto).state,
          location_postal_code: (structuredLocation as StructuredLocationDto).postal_code,
          location_country: (structuredLocation as StructuredLocationDto).country,
          // Guardar professions como JSON
          ...(professions && { professions: professions }),
        },
        select: {
          id: true,
          first_name: true,
          second_name: true,
          first_surname: true,
          second_last_name: true,
          email: true,
          phone: true,
          type_user: true,
          verified: true,
          location_address: true,
          location_lat: true,
          location_lng: true,
          location_place_id: true,
        }
      });

      return {
        status: 'success',
        message: 'Usuario creado exitosamente',
        data: user
      };
    } catch (error) {
      console.error('Error en createUser:', error);
      return {
        status: 'error',
        message: 'Error al crear el usuario'
      };
    }
  }

  async getUserById(id: number): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return {
          status: 'warning',
          message: 'Usuario no encontrado'
        };
      }

      // Crear objeto de ubicación estructurada
      const structuredLocation = {
        street: user.location_street,
        colony: user.location_colony,
        city: user.location_city,
        state: user.location_state,
        postal_code: user.location_postal_code,
        country: user.location_country,
        full_address: user.location_address,
        lat: user.location_lat,
        lng: user.location_lng,
        place_id: user.location_place_id,
        bounds: user.location_bounds
      };

      return {
        status: 'success',
        message: 'Usuario encontrado',
        data: {
          ...user,
          structured_location: structuredLocation
        }
      };
    } catch (error) {
      console.error('Error en getUserById:', error);
      return {
        status: 'error',
        message: 'Error al obtener el usuario'
      };
    }
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      console.log('🚀 updateUser llamado con:', {
        id,
        updateUserDto: JSON.stringify(updateUserDto),
        professions: JSON.stringify(updateUserDto.professions),
        professionsType: typeof updateUserDto.professions,
        isArray: Array.isArray(updateUserDto.professions)
      });
      
      // Buscar el usuario
      const existingUser = await this.prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return {
          status: 'warning',
          message: 'Usuario no encontrado'
        };
      }

      // Procesar imágenes si están presentes
      const imageUpdates: any = {};
      
            // Procesar foto de perfil
            if (updateUserDto.profilePhoto && updateUserDto.profilePhoto.trim() !== '') {
              try {
                const profilePhotoUrl = await this.supabaseStorage.uploadProfilePhoto(
                  updateUserDto.profilePhoto,
                  id
                );
                imageUpdates.profilePhoto = profilePhotoUrl;
              } catch (error) {
                console.error('Error detallado al procesar foto de perfil:', error);
                return {
                  status: 'error',
                  message: `Error al procesar la foto de perfil: ${error.message}`
                };
              }
            }

      // Procesar imagen de fondo
      if (updateUserDto.background && updateUserDto.background.trim() !== '') {
        try {
          const backgroundUrl = await this.supabaseStorage.uploadBackgroundImage(
            updateUserDto.background,
            id
          );
          imageUpdates.background = backgroundUrl;
        } catch (error) {
          return {
            status: 'error',
            message: 'Error al procesar la imagen de fondo'
          };
        }
      }

      // Procesar fotos de trabajo
      if (updateUserDto.workPhotos && updateUserDto.workPhotos.length > 0) {
        try {
          const validWorkPhotos = updateUserDto.workPhotos.filter(photo => 
            photo && photo.trim() !== ''
          );
          
          if (validWorkPhotos.length > 0) {
            const workPhotoUrls = await this.supabaseStorage.uploadWorkPhotos(
              validWorkPhotos,
              id
            );
            imageUpdates.workPhotos = workPhotoUrls;
          }
        } catch (error) {
          return {
            status: 'error',
            message: 'Error al procesar las fotos de trabajo'
          };
        }
      }

      // Preparar los datos para actualizar el usuario
      // Extraer campos especiales que necesitan procesamiento
      const { profilePhoto, background, workPhotos, id: userId, type, professions, ...userData } = updateUserDto;

      console.log('🔍 DEBUG - professions extraído del DTO:', JSON.stringify(professions));
      console.log('🔍 DEBUG - professions en updateUserDto original:', JSON.stringify(updateUserDto.professions));

      // Si se está actualizando la contraseña, encriptarla
      let updateData = { ...userData };
      if (updateUserDto.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateUserDto.password, salt);
      }

      // Preparar datos finales para actualización
      const finalUpdateData: any = {
        ...updateData,
        ...imageUpdates, // Incluir las URLs de las imágenes procesadas
      };
      
      // CRÍTICO: Agregar professions explícitamente SIEMPRE que esté presente en el DTO
      // Usar la misma lógica que createUser: ...(professions && { professions: professions })
      if (updateUserDto.professions !== undefined) {
        // Si professions está en el DTO (incluso si es null o array vacío), actualizarlo
        finalUpdateData.professions = updateUserDto.professions;
        console.log('✅ Professions agregado a finalUpdateData desde updateUserDto:', JSON.stringify(finalUpdateData.professions));
      } else if (professions !== undefined) {
        // Fallback: usar la variable extraída
        finalUpdateData.professions = professions;
        console.log('✅ Professions agregado a finalUpdateData desde variable extraída:', JSON.stringify(finalUpdateData.professions));
      } else {
        console.log('⚠️ WARNING: professions no está en updateUserDto ni en variable extraída');
      }
      
      console.log('📝 Datos finales para actualizar (antes de Prisma):', JSON.stringify({
        ...finalUpdateData,
        password: finalUpdateData.password ? '[HIDDEN]' : undefined
      }));
      console.log('📝 Professions en finalUpdateData antes de Prisma:', JSON.stringify(finalUpdateData.professions));

      // Actualizar el usuario
      const user = await this.prisma.user.update({
        where: { id },
        data: finalUpdateData,
        select: {
          id: true,
          first_name: true,
          second_name: true,
          first_surname: true,
          second_last_name: true,
          email: true,
          phone: true,
          type_user: true,
          verified: true,
          profilePhoto: true,
          background: true,
          workPhotos: true,
          professions: true,
          calendar: true,
          location_address: true,
          location_lat: true,
          location_lng: true,
          location_place_id: true,
        }
      });

      console.log('📖 Professions después de actualizar (raw):', JSON.stringify(user.professions));
      console.log('📖 Tipo de professions:', typeof user.professions, Array.isArray(user.professions));

      // Normalizar el campo professions para asegurar que sea un array plano
      const normalizedProfessions = this.normalizeProfessions(user.professions);
      console.log('✨ Professions normalizadas:', JSON.stringify(normalizedProfessions));
      
      const normalizedUser = {
        ...user,
        professions: normalizedProfessions
      };

      return {
        status: 'success',
        message: 'Usuario actualizado exitosamente',
        data: normalizedUser
      };
    } catch (error) {
      console.error('Error en updateUser:', error);
      return {
        status: 'error',
        message: 'Error al actualizar el usuario'
      };
    }
  }

  async searchCustomers(searchParams: SearchCustomersDto): Promise<UserResponseDto> {
    try {
      const { type_service, type_location, page = 1 } = searchParams;
      const pageSize = 2;
      const offset = (page - 1) * pageSize;

      let whereCondition: any = {};

      // Agregar condición para profesiones si existe type_service
      if (type_service) {
        whereCondition.professions = {
          path: '$[*].id',
          array_contains: type_service
        };
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: whereCondition,
          skip: offset,
          take: pageSize,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            first_name: true,
            second_name: true,
            first_surname: true,
            second_last_name: true,
            email: true,
            phone: true,
            description: true,
            type_user: true,
            verified: true,
            reviewsCount: true,
            rating: true,
            professions: true,
            workPhotos: true,
            location_address: true,
            location_lat: true,
            location_lng: true,
            location_place_id: true
          }
        }),
        this.prisma.user.count({
          where: whereCondition
        })
      ]);

      const totalPages = Math.ceil(total / pageSize);
      const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

      if (!users.length) {
        return {
          status: 'warning',
          message: 'No se encontraron usuarios',
          totalPages: [],
          currentPage: page,
          pageSize: pageSize
        };
      }

      return {
        status: 'success',
        message: 'Usuarios encontrados',
        data: users,
        totalPages: pageNumbers,
        currentPage: page,
        pageSize: pageSize,
        total: total
      };

    } catch (error) {
      console.error('Error en la consulta:', error);
      return {
        status: 'error',
        message: 'Error al buscar usuarios'
      };
    }
  }

  // Métodos adicionales para mantener compatibilidad
  create(createUserDto: CreateUserDto) {
    return this.createUser(createUserDto);
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return this.getUserById(id);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.updateUser(id, updateUserDto);
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async rawUser(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          // Incluir todas las relaciones para obtener el esquema completo
          jobs: true,
          sentMessages: true,
          receivedMessages: true,
          user1Chats: true,
          user2Chats: true,
          proposals: true,
          reviews: true,
        }
      });

      if (!user) {
        return {
          status: 'warning',
          message: 'Usuario no encontrado'
        };
      }

      // Devolver el objeto tal como viene de la base de datos con todas las relaciones
      return {
        status: 'success',
        message: 'Usuario raw encontrado',
        data: user
      };
    } catch (error) {
      console.error('Error en rawUser:', error);
      return {
        status: 'error',
        message: 'Error al obtener el usuario'
      };
    }
  }

  /**
   * Corrige la ubicación estructurada de un usuario existente
   */
  async fixStructuredLocation(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return {
          status: 'warning',
          message: 'Usuario no encontrado'
        };
      }

      if (!user.location_address) {
        return {
          status: 'warning',
          message: 'El usuario no tiene dirección registrada'
        };
      }

      // Crear un objeto location simulado para usar con parseStructuredLocation
      const mockLocation = {
        municipio: user.location_city,
        estado: user.location_state,
        codigo_postal: user.location_postal_code,
        pais: user.location_country
      };

      // Parsear la ubicación con la función mejorada
      const structuredLocation = this.parseStructuredLocation(user.location_address, mockLocation);

      // Actualizar el usuario con la ubicación corregida
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          location_street: structuredLocation.street,
          location_colony: structuredLocation.colony,
          location_city: structuredLocation.city,
          location_state: structuredLocation.state,
          location_postal_code: structuredLocation.postal_code,
          location_country: structuredLocation.country,
        }
      });

      return {
        status: 'success',
        message: 'Ubicación estructurada corregida exitosamente',
        data: {
          user_id: id,
          old_location: {
            street: user.location_street,
            colony: user.location_colony,
            city: user.location_city,
            state: user.location_state,
            postal_code: user.location_postal_code,
            country: user.location_country
          },
          new_location: structuredLocation
        }
      };
    } catch (error) {
      console.error('Error en fixStructuredLocation:', error);
      return {
        status: 'error',
        message: 'Error al corregir la ubicación estructurada'
      };
    }
  }



  /**
   * Parsea una dirección completa en componentes estructurados
   */
  private parseStructuredLocation(address: string, location: any): StructuredLocationDto {
    const parts = address.split(',').map(part => part.trim());
    
    // Función para extraer código postal de una cadena
    const extractPostalCode = (text: string): string | undefined => {
      const postalMatch = text.match(/\b\d{5}\b/);
      return postalMatch ? postalMatch[0] : undefined;
    };

    // Función para limpiar texto de código postal
    const cleanFromPostalCode = (text: string): string => {
      return text.replace(/\b\d{5}\b/g, '').trim();
    };

    // Determinar colonia (segunda parte sin código postal)
    let colony = parts[1] || undefined;
    if (colony) {
      colony = cleanFromPostalCode(colony);
      if (colony === '') colony = undefined;
    }

    // Determinar código postal (buscar en todas las partes)
    let postalCode = location.codigo_postal || undefined;
    if (!postalCode) {
      for (const part of parts) {
        const found = extractPostalCode(part);
        if (found) {
          postalCode = found;
          break;
        }
      }
    }

    // Determinar ciudad (municipio del usuario o tercera parte limpia)
    let city = location.municipio || undefined;
    if (!city && parts[2]) {
      city = cleanFromPostalCode(parts[2]);
      if (city === '') city = undefined;
    }

    return {
      street: parts[0] || undefined, // Primera parte: calle y número
      colony: colony, // Segunda parte: colonia (sin código postal)
      city: city, // Ciudad/municipio
      state: location.estado || parts[3] || undefined, // Estado
      postal_code: postalCode, // Código postal extraído
      country: location.pais || 'México', // País
      full_address: address, // Dirección completa para compatibilidad
    };
  }

  /**
   * Construye una dirección completa usando el país del usuario
   */
  private buildCompleteAddress(address: string, location: any): string {
    const parts: string[] = [];
    
    // Agregar la dirección base
    parts.push(address.trim());
    
    // Agregar municipio si existe
    if (location.municipio) {
      parts.push(location.municipio.trim());
    }
    
    // Agregar estado si existe
    if (location.estado) {
      parts.push(location.estado.trim());
    }
    
    // Agregar código postal si existe
    if (location.codigo_postal) {
      parts.push(location.codigo_postal.trim());
    }
    
    // Usar el país del usuario, o México por defecto
    const pais = location.pais || 'México';
    parts.push(pais);
    
    const fullAddress = parts.join(', ');
    
    return fullAddress;
  }

  async searchCustomersPost(searchParams: SearchCustomersPostDto): Promise<UserResponseDto> {
    try {
      const { type, type_service, type_location, page = 1 } = searchParams;
      const pageSize = 10; // Aumentamos el tamaño de página para POST
      const offset = (page - 1) * pageSize;

      let whereCondition: any = {};

      // Filtrar por tipo de usuario si es necesario
      if (type === 'get-user') {
        // Buscar trabajadores (profesionales)
        whereCondition.type_user = 'worker';
      }

      // Agregar condición para profesiones si existe type_service (comentado temporalmente)
      // if (type_service) {
      //   // Usar consulta SQL raw para buscar en el JSON
      //   whereCondition.professions = {
      //     not: null
      //   };
      // }

      // Filtrar por ubicación usando place_id o descripción
      if (type_location?.place_id) {
        // Buscar por place_id exacto o por descripción que contenga "Cancún"
        whereCondition.OR = [
          { location_place_id: type_location.place_id },
          { location_address: { contains: 'Cancún' } }
        ];
      }

      // Consulta normal con todos los filtros
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: whereCondition,
          skip: offset,
          take: pageSize,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            first_name: true,
            second_name: true,
            first_surname: true,
            second_last_name: true,
            email: true,
            phone: true,
            description: true,
            type_user: true,
            verified: true,
            reviewsCount: true,
            rating: true,
            professions: true,
            workPhotos: true,
            location_address: true,
            location_lat: true,
            location_lng: true,
            location_place_id: true,
            profilePhoto: true
          }
        }),
        this.prisma.user.count({
          where: whereCondition
        })
      ]);

      // Filtrar por profesiones en JavaScript si es necesario
      let filteredUsers = users;
      if (type_service) {
        // type_service es el id de la profesión directamente
        filteredUsers = users.filter(user => {
          if (!user.professions || !Array.isArray(user.professions)) {
            return false;
          }
          return user.professions.some(prof => 
            prof && typeof prof === 'object' && (prof as any).id === type_service
          );
        });
      }

      return {
        status: 'success',
        message: `Se encontraron ${filteredUsers.length} profesionales`,
        data: {
          users: filteredUsers,
          pagination: {
            page,
            pageSize,
            total: filteredUsers.length,
            totalPages: Math.ceil(filteredUsers.length / pageSize)
          },
          searchParams: {
            type,
            type_service,
            location: type_location,
            page
          }
        }
      };

    } catch (error) {
      console.error('Error en búsqueda POST:', error);
      return {
        status: 'error',
        message: 'Error al buscar profesionales',
        data: null
      };
    }
  }

  async updateRating(userId: number, rating: number) {
    try {
      // Verificar que el usuario existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return {
          status: 'error',
          message: 'Usuario no encontrado',
          data: null
        };
      }

      // Actualizar el rating del usuario
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          rating: rating
        },
        select: {
          id: true,
          first_name: true,
          first_surname: true,
          rating: true,
          reviewsCount: true
        }
      });

      return {
        status: 'success',
        message: 'Rating actualizado exitosamente',
        data: updatedUser
      };
    } catch (error) {
      console.error('Error updating rating:', error);
      return {
        status: 'error',
        message: 'Error al actualizar el rating',
        data: null
      };
    }
  }

  async findUserWithReviewsAndProposals(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          // Información básica del usuario
          jobs: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              created_at: true,
              updated_at: true,
              category: true,
              budget: true,
              location: true,
              urgency: true,
              professions: true,
              images: true,
              price: true,
              proposalsCount: true,
              viewsCount: true,
              requirements: true,
              timeline: true,
              workType: true
            },
            orderBy: {
              created_at: 'desc'
            }
          },
          proposals: {
            include: {
              user: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  profilePhoto: true,
                  email: true,
                  phone: true,
                  type_user: true
                }
              },
              message: {
                select: {
                  id: true,
                  message: true,
                  created_at: true,
                  title: true,
                  type_message: true
                }
              }
            },
            orderBy: {
              created_at: 'desc'
            }
          },
          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  first_name: true,
                  first_surname: true,
                  profilePhoto: true
                }
              }
            },
            orderBy: {
              created_at: 'desc'
            }
          }
        }
      });

      if (!user) {
        return {
          status: 'error',
          message: 'Usuario no encontrado',
          data: null
        };
      }

      // Buscar job proposals relacionadas con las reviews del usuario
      const reviewsWithProposals = await Promise.all(
        user.reviews.map(async (review) => {
          let proposal: any = null;
          
          if (review.job_id) {
            proposal = await this.prisma.jobProposal.findFirst({
              where: {
                id: review.job_id
              },
              include: {
                user: {
                  select: {
                    id: true,
                    first_name: true,
                    first_surname: true,
                    profilePhoto: true
                  }
                },
                message: {
                  select: {
                    id: true,
                    message: true,
                    created_at: true
                  }
                }
              }
            });
          }

          return {
            ...review,
            proposal
          };
        })
      );

      // Normalizar el campo professions
      const normalizedUser = {
        ...user,
        professions: this.normalizeProfessions(user.professions),
        reviews: reviewsWithProposals
      };

      return {
        status: 'success',
        message: 'Usuario con reviews y propuestas obtenido exitosamente',
        data: normalizedUser
      };
    } catch (error) {
      console.error('Error fetching user with reviews and proposals:', error);
      return {
        status: 'error',
        message: 'Error al obtener el usuario con reviews y propuestas',
        data: null
      };
    }
  }
}
