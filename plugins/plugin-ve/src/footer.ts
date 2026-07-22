// ─── Receipt Footer ──────────────────────────────────────────

/** Pie de recibo según tipo de documento */
export function getReceiptFooter(type: 'FACTURA' | 'TICKET'): string[] {
  const base = ['¡Gracias por su compra!']
  if (type === 'FACTURA') {
    return [...base, 'Original — Cliente', 'Copia — Emisor', 'Exija su factura — SENIAT']
  }
  return [...base, 'Exija su factura — SENIAT', 'Este documento no es un comprobante fiscal']
}

/** Alias para compatibilidad — usa TICKET por defecto */
export const RECEIPT_FOOTER = getReceiptFooter('TICKET')
