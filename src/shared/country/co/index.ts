// ─── Colombia Country Data ──────────────────────────────────

export const TAX_ID_LABEL = 'NIT'
export const CURRENCY_SYMBOL = '$'
export const CURRENCY_CODE = 'COP'
export const COUNTRY_CODE = 'CO'

export const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Efectivo' },
  { id: 'TRANSFER', label: 'Transferencia / PSE' },
  { id: 'DEBIT_CARD', label: 'Tarjeta Débito' },
  { id: 'CREDIT_CARD', label: 'Tarjeta Crédito' },
  { id: 'NEQUI', label: 'Nequi' },
  { id: 'DAVIPLATA', label: 'DaviPlata' }
]

export const RECEIPT_FOOTER = [
  '¡Gracias por su compra!',
  'Factura electrónica — DIAN',
  'Resolución DIAN N° XXXXX'
]

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/** Valida un NIT colombiano (placeholder) */
export function validateNit(nit: string): { valid: boolean; error?: string } {
  const clean = nit.replace(/[^0-9]/g, '')
  if (clean.length < 9) return { valid: false, error: 'NIT inválido: mínimo 9 dígitos' }
  return { valid: true }
}

/** Formatea un NIT: 900123456 → 900.123.456-7 */
export function formatNit(raw: string): string {
  const clean = raw.replace(/[^0-9]/g, '')
  if (clean.length < 10) return raw
  const base = clean.slice(0, -1)
  const dv = clean.slice(-1)
  return `${base.replace(/(\d{3})(?=\d)/g, '$1.')}-${dv}`
}
