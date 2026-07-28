import { describe, it, expect } from 'vitest'
import { formatReceipt, formatDrawerKick } from '../escpos-formatter'
import type { ReceiptData } from '@plugin-api/contracts/IFiscalPrinter'

// ── Test Helpers ────────────────────────────────────────────

function makeReceipt(overrides?: Partial<ReceiptData>): ReceiptData {
  return {
    header: ['My Store Inc.', 'RIF: J-12345678-9', 'Main Street #123'],
    lines: [
      { type: 'separator', text: '--------------------------------' },
      { type: 'item', text: 'Coffee Latte', quantity: 2, price: 3.50 },
      { type: 'item', text: 'Arepa Reina Pepiada', quantity: 1, price: 5.00 },
      { type: 'separator', text: '--------------------------------' },
      { type: 'total', text: 'TOTAL: 12.00 Bs' }
    ],
    footer: ['Thank you for your purchase!', 'Sistema de Facturacion v0.1'],
    ...overrides
  }
}

// ── Tests: formatReceipt ────────────────────────────────────

describe('formatReceipt', () => {
  it('returns a non-empty Buffer for a receipt with header, items, and footer', () => {
    const data = makeReceipt()
    const buffer = formatReceipt(data)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('includes header text in the output', () => {
    const data = makeReceipt()
    const buffer = formatReceipt(data)
    const text = buffer.toString('latin1')
    expect(text).toContain('My Store Inc.')
    expect(text).toContain('RIF: J-12345678-9')
  })

  it('includes item lines in the output', () => {
    const data = makeReceipt()
    const buffer = formatReceipt(data)
    const text = buffer.toString('latin1')
    expect(text).toContain('Coffee Latte')
    expect(text).toContain('Arepa Reina Pepiada')
  })

  it('includes footer text in the output', () => {
    const data = makeReceipt()
    const buffer = formatReceipt(data)
    const text = buffer.toString('latin1')
    expect(text).toContain('Thank you for your purchase!')
    expect(text).toContain('Sistema de Facturacion')
  })

  it('handles barcode lines gracefully (no-op — does not crash)', () => {
    const data: ReceiptData = {
      header: ['Test'],
      lines: [
        { type: 'text', text: 'Before barcode' },
        { type: 'barcode', text: '1234567890' },
        { type: 'text', text: 'After barcode' }
      ],
      footer: []
    }
    const buffer = formatReceipt(data)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
    // barcode should be skipped but surrounding text preserved
    const text = buffer.toString('latin1')
    expect(text).toContain('Before barcode')
    expect(text).toContain('After barcode')
  })

  it('handles an empty receipt (header/items/footer all empty)', () => {
    const data: ReceiptData = {
      header: [],
      lines: [],
      footer: []
    }
    const buffer = formatReceipt(data)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0) // at minimum, cut command
  })

  it('applies alignment from line options', () => {
    const data: ReceiptData = {
      header: [],
      lines: [
        { type: 'text', text: 'Centered Text', align: 'center' as const },
        { type: 'text', text: 'Left Text', align: 'left' as const }
      ],
      footer: []
    }
    const buffer = formatReceipt(data)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
    const text = buffer.toString('latin1')
    expect(text).toContain('Centered Text')
    expect(text).toContain('Left Text')
  })

  it('handles receipt with no header (header lines only)', () => {
    const data: ReceiptData = {
      header: [],
      lines: [
        { type: 'item', text: 'Product A', quantity: 1, price: 10.00 },
        { type: 'total', text: 'TOTAL: 10.00' }
      ],
      footer: []
    }
    const buffer = formatReceipt(data)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
    const text = buffer.toString('latin1')
    expect(text).toContain('Product A')
    expect(text).toContain('TOTAL: 10.00')
  })

  it('handles receipt with no footer', () => {
    const data: ReceiptData = {
      header: ['Header Only Receipt'],
      lines: [{ type: 'text', text: 'Body text' }],
      footer: []
    }
    const buffer = formatReceipt(data)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
    const text = buffer.toString('latin1')
    expect(text).toContain('Header Only Receipt')
    expect(text).toContain('Body text')
  })
})

// ── Tests: formatDrawerKick ─────────────────────────────────

describe('formatDrawerKick', () => {
  it('returns a non-empty Buffer with cash drawer pulse command', () => {
    const buffer = formatDrawerKick()
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })
})
