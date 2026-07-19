/**
 * Define un país/región para el sistema.
 * Cada país se implementa como un plugin que implementa esta interfaz.
 *
 * plugin-ve (Venezuela) es GRATIS y viene bundled.
 * Otros países (CO, MX, EC, etc.) son plugins PAGOS cargados dinámicamente.
 */
export interface TaxIdValidation {
  valid: boolean
  error?: string
}

export interface PaymentMethod {
  id: string
  label: string
}

export interface DefaultTax {
  name: string
  rate: number
  description?: string
}

export interface ICountryPlugin {
  /** Código ISO del país: 'VE', 'CO', 'MX', 'EC', 'PA' */
  countryCode: string

  /** Nombre del país */
  countryName: string

  /** Símbolo de moneda: 'Bs.', '$', 'MXN$' */
  currencySymbol: string

  /** Código de moneda ISO: 'VES', 'COP', 'MXN', 'USD' */
  currencyCode: string

  /** Etiqueta del identificador fiscal: 'RIF', 'NIT', 'RFC', 'RUC' */
  taxIdLabel: string

  /** Valida un identificador fiscal según las reglas del país */
  validateTaxId(taxId: string): TaxIdValidation

  /** Formatea un identificador fiscal: 'J123456784' → 'J-12345678-4' */
  formatTaxId(raw: string): string

  /** Formatea un monto en la moneda del país */
  formatCurrency(amount: number): string

  /** Impuestos por defecto para el país */
  getDefaultTaxes(): DefaultTax[]

  /** Métodos de pago disponibles en el país */
  getPaymentMethods(): PaymentMethod[]

  /** Pie de factura/recibo con leyendas fiscales */
  getReceiptFooter(): { lines: string[] }

  /** Formato de número de factura (opcional) */
  getInvoiceNumberFormat?(): { prefix: string; startAt: number }

  /** Tasa de cambio por defecto (si el país usa moneda dual) */
  getDefaultExchangeRate?(): number | null
}
