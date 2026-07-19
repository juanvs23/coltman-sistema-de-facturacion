// ─── Venezuela Country Data ──────────────────────────────────

/** Etiqueta del identificador fiscal para el país */
export const TAX_ID_LABEL = 'RIF'

/** Símbolo de moneda */
export const CURRENCY_SYMBOL = 'Bs.'

/** Código de moneda ISO */
export const CURRENCY_CODE = 'VES'

/** Código del país ISO */
export const COUNTRY_CODE = 'VE'

/** Métodos de pago disponibles en Venezuela */
export const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Efectivo' },
  { id: 'TRANSFER', label: 'Transferencia / Pago Móvil' },
  { id: 'DEBIT_CARD', label: 'Tarjeta de Débito' },
  { id: 'CREDIT_CARD', label: 'Tarjeta de Crédito' },
  { id: 'DIVISA', label: 'Divisa (USD)' },
  { id: 'MIXED', label: 'Mixto' }
]

/** Pie de recibo */
export const RECEIPT_FOOTER = [
  '¡Gracias por su compra!',
  'Exija su factura — SENIAT',
  'Este documento no es un comprobante fiscal'
]

/** Formatea un monto en la moneda del país */
export function formatCurrency(amount: number): string {
  return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── RIF Validation ──────────────────────────────────────────

const RIF_LETTER_VALUES: Record<string, number> = { V: 1, E: 2, J: 3, P: 4, G: 5 }
const WEIGHTS = [4, 3, 2, 7, 6, 5, 4, 3, 2]

/**
 * Valida un RIF venezolano.
 * Formato: [J|V|E|G|P]-XXXXXXXX-X
 */
export function validateRif(rif: string): { valid: boolean; error?: string } {
  const clean = rif.trim().toUpperCase()

  if (!/^[JGVEP]-\d{8}-\d$/.test(clean)) {
    return { valid: false, error: 'Formato inválido. Debe ser: J-12345678-9' }
  }

  const letter = clean[0]
  const parts = clean.split('-')
  const digits = parts[1] // 8 digits
  const checkDigit = parseInt(parts[2], 10)

  // El algoritmo usa el valor de la letra + los 8 dígitos
  const letterVal = RIF_LETTER_VALUES[letter]
  const nums = [letterVal, ...digits.split('').map(Number)]

  let sum = 0
  for (let i = 0; i < nums.length; i++) {
    sum += nums[i] * WEIGHTS[i]
  }

  const mod = sum % 11
  const calculated = mod === 0 ? 0 : mod === 1 ? 9 : 11 - mod

  if (calculated !== checkDigit) {
    return { valid: false, error: 'Dígito verificador inválido' }
  }

  return { valid: true }
}

/**
 * Formatea un RIF: elimina caracteres no alfanuméricos
 * y lo convierte a formato L-XXXXXXXX-X.
 */
export function formatRif(rif: string): string {
  const clean = rif.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (clean.length !== 10) return rif
  return `${clean[0]}-${clean.slice(1, 9)}-${clean.slice(9)}`
}
