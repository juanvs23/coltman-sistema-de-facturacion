import { describe, it, expect } from 'vitest'
import { getReceiptFooter } from '../footer'

describe('getReceiptFooter', () => {
  it('returns TICKET footer with non-fiscal notice', () => {
    const footer = getReceiptFooter('TICKET')
    expect(footer).toContain('¡Gracias por su compra!')
    expect(footer).toContain('Este documento no es un comprobante fiscal')
  })

  it('returns FACTURA footer with SENIAT legend and original/copia lines', () => {
    const footer = getReceiptFooter('FACTURA')
    expect(footer).toContain('Original — Cliente')
    expect(footer).toContain('Copia — Emisor')
    expect(footer).toContain('Exija su factura — SENIAT')
    expect(footer).not.toContain('Este documento no es un comprobante fiscal')
  })
})
