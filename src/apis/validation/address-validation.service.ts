import { Injectable } from '@nestjs/common';

export interface AddressValidationResult {
  isValid: boolean;
  cleanAddress: string;
  suggestions: string[];
  errors: string[];
}

@Injectable()
export class AddressValidationService {
  
  /**
   * Valida y limpia una dirección antes de enviarla a Google Maps
   */
  validateAddressInput(address: string): AddressValidationResult {
    const errors: string[] = [];
    const suggestions: string[] = [];
    
    // Validaciones básicas
    if (!address || typeof address !== 'string') {
      errors.push('La dirección es requerida');
      return { isValid: false, cleanAddress: '', suggestions, errors };
    }

    const trimmedAddress = address.trim();
    
    // Verificar longitud mínima
    if (trimmedAddress.length < 10) {
      errors.push('La dirección debe tener al menos 10 caracteres');
      suggestions.push('Incluye calle, número, colonia y ciudad');
    }

    // Verificar longitud máxima
    if (trimmedAddress.length > 200) {
      errors.push('La dirección es muy larga (máximo 200 caracteres)');
      suggestions.push('Usa una dirección más concisa');
    }

    // Verificar caracteres válidos
    const invalidChars = /[<>{}[\]\\|`~!@#$%^&*()+=\/]/g;
    if (invalidChars.test(trimmedAddress)) {
      errors.push('La dirección contiene caracteres no válidos');
      suggestions.push('Usa solo letras, números, comas, puntos y guiones');
    }

    // Verificar que no sea solo números
    if (/^\d+$/.test(trimmedAddress)) {
      errors.push('La dirección no puede ser solo números');
      suggestions.push('Incluye el nombre de la calle y ciudad');
    }

    // Verificar que no sea solo letras sin números (para direcciones específicas)
    // Solo aplicar esta validación si la dirección es muy corta y no tiene contexto
    if (!/\d/.test(trimmedAddress) && trimmedAddress.length > 30 && !trimmedAddress.includes(',')) {
      suggestions.push('Considera incluir número de casa, código postal o referencia específica');
    }

    // Verificar patrones comunes de direcciones mexicanas
    const mexicanPatterns = [
      /calle\s+\d+/i,
      /avenida\s+\d+/i,
      /av\.\s+\d+/i,
      /blvd\.\s+\d+/i,
      /boulevard\s+\d+/i,
      /\d+\s+de\s+\w+/i, // "123 de Mayo"
      /\d+\s+y\s+\d+/i,  // "123 y 456"
    ];

    const hasValidPattern = mexicanPatterns.some(pattern => pattern.test(trimmedAddress));
    if (!hasValidPattern && trimmedAddress.length > 25) {
      suggestions.push('Considera usar formato: "Calle 123, Colonia, Ciudad"');
    }

    // Limpiar la dirección
    const cleanAddress = trimmedAddress
      .replace(/[^\w\s,.-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, ' ') // Normalizar espacios
      .replace(/,\s*,/g, ',') // Remover comas dobles
      .replace(/^,\s*|,\s*$/g, '') // Remover comas al inicio y final
      .trim();

    // Verificar que la dirección limpia no esté vacía
    if (!cleanAddress) {
      errors.push('La dirección no contiene información válida');
      return { isValid: false, cleanAddress: '', suggestions, errors };
    }

    return {
      isValid: errors.length === 0,
      cleanAddress,
      suggestions,
      errors
    };
  }

  /**
   * Sugiere mejoras para una dirección
   */
  suggestAddressImprovements(address: string): string[] {
    const suggestions: string[] = [];
    const lowerAddress = address.toLowerCase();

    // Sugerencias basadas en patrones comunes
    if (!lowerAddress.includes('calle') && !lowerAddress.includes('av') && !lowerAddress.includes('avenida')) {
      suggestions.push('Considera especificar el tipo de vía: "Calle", "Avenida", "Boulevard"');
    }

    if (!lowerAddress.includes(',') && address.length > 20) {
      suggestions.push('Usa comas para separar: "Calle 123, Colonia Centro, Ciudad"');
    }

    if (!/\d/.test(address)) {
      suggestions.push('Incluye el número de casa o edificio');
    }

    if (!lowerAddress.includes('méxico') && !lowerAddress.includes('mx')) {
      suggestions.push('Considera agregar el país al final: "...México"');
    }

    return suggestions;
  }

  /**
   * Valida coordenadas geográficas (flexible para cualquier país)
   */
  validateCoordinates(lat: number, lng: number, pais?: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar que no sean coordenadas (0,0) que indican error
    if (lat === 0 && lng === 0) {
      errors.push('Las coordenadas (0,0) no son válidas');
    }

    // Validar que las coordenadas estén en un rango geográfico válido
    if (lat < -90 || lat > 90) {
      errors.push(`La latitud (${lat}) está fuera del rango válido (-90 a 90)`);
    }

    if (lng < -180 || lng > 180) {
      errors.push(`La longitud (${lng}) está fuera del rango válido (-180 a 180)`);
    }

    // Si se especifica México, validar coordenadas mexicanas
    if (pais && pais.toLowerCase().includes('méxico')) {
      if (lat < 14.5 || lat > 32.7) {
        errors.push(`La latitud (${lat}) está fuera del rango de México (14.5 a 32.7)`);
      }
      if (lng < -118.4 || lng > -86.7) {
        errors.push(`La longitud (${lng}) está fuera del rango de México (-118.4 a -86.7)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Detecta direcciones sospechosas o spam
   */
  detectSuspiciousAddress(address: string): { isSuspicious: boolean; reasons: string[] } {
    const reasons: string[] = [];
    const lowerAddress = address.toLowerCase();

    // Patrones sospechosos
    const suspiciousPatterns = [
      /test/i,
      /prueba/i,
      /ejemplo/i,
      /fake/i,
      /falso/i,
      /123\s+123/i,
      /abc\s+abc/i,
      /direccion\s+de\s+prueba/i,
    ];

    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(lowerAddress)) {
        reasons.push('Dirección parece ser de prueba');
      }
    });

    // Verificar repeticiones excesivas
    if (/(\w+)\s+\1\s+\1/.test(lowerAddress)) {
      reasons.push('Dirección contiene repeticiones sospechosas');
    }

    // Verificar caracteres repetidos
    if (/(.)\1{4,}/.test(address)) {
      reasons.push('Dirección contiene caracteres repetidos excesivamente');
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons
    };
  }
}
