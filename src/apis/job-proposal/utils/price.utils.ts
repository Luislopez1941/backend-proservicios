/**
 * Utilidades para manejo de precios y monedas
 */

export class PriceUtils {
  /**
   * Convierte pesos a centavos
   * @param pesos - Cantidad en pesos (ej: 50.00)
   * @returns Centavos (ej: 5000)
   */
  static pesosToCents(pesos: number): number {
    return Math.round(pesos * 100);
  }

  /**
   * Convierte centavos a pesos
   * @param cents - Cantidad en centavos (ej: 5000)
   * @returns Pesos (ej: 50.00)
   */
  static centsToPesos(cents: number): number {
    return cents / 100;
  }

  /**
   * Formatea precio con símbolo de moneda
   * @param cents - Cantidad en centavos
   * @param currency - Código de moneda (MXN, USD, EUR)
   * @returns Precio formateado (ej: "$50.00 MXN")
   */
  static formatPrice(cents: number, currency: string = 'MXN'): string {
    const pesos = this.centsToPesos(cents);
    const symbol = this.getCurrencySymbol(currency);
    return `${symbol}${pesos.toFixed(2)} ${currency}`;
  }

  /**
   * Obtiene el símbolo de moneda
   * @param currency - Código de moneda
   * @returns Símbolo de moneda
   */
  static getCurrencySymbol(currency: string): string {
    const symbols: { [key: string]: string } = {
      'MXN': '$',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'CNY': '¥',
      'BRL': 'R$',
      'ARS': '$',
      'CLP': '$',
      'COP': '$',
      'PEN': 'S/',
      'UYU': '$U',
      'VEF': 'Bs',
      'BTC': '₿',
      'ETH': 'Ξ'
    };
    return symbols[currency.toUpperCase()] || '$';
  }

  /**
   * Valida si un código de moneda es válido
   * @param currency - Código de moneda
   * @returns true si es válido
   */
  static isValidCurrency(currency: string): boolean {
    const validCurrencies = [
      'MXN', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY',
      'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'VEF', 'BTC', 'ETH'
    ];
    return validCurrencies.includes(currency.toUpperCase());
  }

}
