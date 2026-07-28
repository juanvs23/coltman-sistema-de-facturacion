import { describe, it, expect } from 'vitest'
import { isBasicPrinterPlugin } from '../isBasicPrinterPlugin'

// ── Test Helpers ────────────────────────────────────────────

/** Minimal IBasicPrinter shape for positive detection */
function makeBasicPrinter() {
  return {
    type: 'basic-printer' as const,
    displayName: 'Test Basic Printer',
    testConnection: async () => ({ success: true }),
    printReceipt: async () => ({ success: true }),
    getStatus: async () => ({ success: true, data: { online: true, paperOut: false, drawerOpen: false } }),
    openDrawer: async () => ({ success: true })
  }
}

/** Minimal IFiscalPrinter shape (has printInvoice) */
function makeFiscalPrinter() {
  return {
    type: 'bixolon' as const,
    displayName: 'Bixolon SRP-350',
    testConnection: async () => ({ success: true }),
    printReceipt: async () => ({ success: true }),
    printInvoice: async () => ({ success: true }),
    getStatus: async () => ({ success: true, data: { online: true, paperOut: false, drawerOpen: false } }),
    openDrawer: async () => ({ success: true })
  }
}

// ── Tests ───────────────────────────────────────────────────

describe('isBasicPrinterPlugin', () => {
  it('detects an object with all 4 required methods and no printInvoice', () => {
    const plugin = makeBasicPrinter()
    expect(isBasicPrinterPlugin(plugin)).toBe(true)
  })

  it('rejects an object that includes printInvoice (fiscal exclusion)', () => {
    const plugin = makeFiscalPrinter()
    expect(isBasicPrinterPlugin(plugin)).toBe(false)
  })

  it('rejects null', () => {
    expect(isBasicPrinterPlugin(null)).toBe(false)
  })

  it('rejects primitives (string, number, boolean, undefined)', () => {
    expect(isBasicPrinterPlugin('hello')).toBe(false)
    expect(isBasicPrinterPlugin(42)).toBe(false)
    expect(isBasicPrinterPlugin(true)).toBe(false)
    expect(isBasicPrinterPlugin(undefined)).toBe(false)
  })

  it('rejects an object missing one required method (openDrawer)', () => {
    const plugin = {
      type: 'basic-printer',
      displayName: 'Incomplete',
      testConnection: async () => ({ success: true }),
      printReceipt: async () => ({ success: true }),
      getStatus: async () => ({ success: true, data: { online: true, paperOut: false, drawerOpen: false } })
      // missing openDrawer
    }
    expect(isBasicPrinterPlugin(plugin)).toBe(false)
  })

  it('detects a plugin with extra non-function properties but no printInvoice', () => {
    const plugin = {
      type: 'basic-printer' as const,
      displayName: 'Extra Props Printer',
      version: '1.0.0',
      manufacturer: 'TestCorp',
      testConnection: async () => ({ success: true }),
      printReceipt: async () => ({ success: true }),
      getStatus: async () => ({ success: true, data: { online: true, paperOut: false, drawerOpen: false } }),
      openDrawer: async () => ({ success: true })
    }
    expect(isBasicPrinterPlugin(plugin)).toBe(true)
  })
})
