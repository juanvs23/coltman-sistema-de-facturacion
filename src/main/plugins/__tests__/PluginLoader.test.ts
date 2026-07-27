import { describe, it, expect, vi } from 'vitest'
import type { IFiscalPrinter, FiscalPrinterType } from '@plugin-api/contracts/IFiscalPrinter'
import { isFiscalPrinterPlugin } from '../isFiscalPrinterPlugin'

const mockFiscalPrinter: IFiscalPrinter = {
  type: 'bixolon' as FiscalPrinterType,
  displayName: 'Bixolon SRP-350',
  testConnection: vi.fn().mockResolvedValue({ success: true }),
  printReceipt: vi.fn().mockResolvedValue({ success: true }),
  printInvoice: vi.fn().mockResolvedValue({ success: true }),
  openDrawer: vi.fn().mockResolvedValue({ success: true }),
  getStatus: vi.fn().mockResolvedValue({
    success: true,
    data: { online: true, paperOut: false, drawerOpen: false }
  })
}

describe('isFiscalPrinterPlugin', () => {
  it('should return true for an object with type and testConnection', () => {
    expect(isFiscalPrinterPlugin(mockFiscalPrinter)).toBe(true)
  })

  it('should return false when type is missing', () => {
    const plugin = { ...mockFiscalPrinter, type: undefined }
    expect(isFiscalPrinterPlugin(plugin)).toBe(false)
  })

  it('should return false when testConnection is missing', () => {
    const { testConnection, ...noTest } = mockFiscalPrinter
    expect(isFiscalPrinterPlugin(noTest)).toBe(false)
  })

  it('should return false when testConnection is not a function', () => {
    const plugin = { ...mockFiscalPrinter, testConnection: 'not-a-function' }
    expect(isFiscalPrinterPlugin(plugin)).toBe(false)
  })

  it('should return false for null', () => {
    expect(isFiscalPrinterPlugin(null)).toBe(false)
  })

  it('should return false for a plain object without fiscal printer shape', () => {
    expect(isFiscalPrinterPlugin({ name: 'not-a-printer' })).toBe(false)
  })

  it('should return false for a country plugin (duck-type differentiator)', () => {
    const countryPlugin = {
      countryCode: 'VE',
      countryName: 'Venezuela',
      validateTaxId: vi.fn()
    }
    expect(isFiscalPrinterPlugin(countryPlugin)).toBe(false)
  })
})
