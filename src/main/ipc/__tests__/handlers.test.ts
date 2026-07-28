import { describe, it, expect, vi } from 'vitest'
import {
  handlePrinterTest,
  handlePrintReceipt,
  handlePrinterStatus,
  handleOpenDrawer,
  handleCheckPrinterLicense,
} from '../handlers'
import type { AppKernel } from '../../core/kernel/AppKernel'
import type { LicenseManager } from '../../core/license/LicenseManager'
import type { IFiscalPrinter, FiscalPrinterType } from '@plugin-api/contracts/IFiscalPrinter'
import type { IBasicPrinter } from '@plugin-api/contracts/IBasicPrinter'

// ── Shared mock factories ──────────────────────────────────────

function mockLicenseManager(valid: boolean, message?: string): LicenseManager {
  return {
    isFeatureEnabled: vi.fn().mockResolvedValue({
      valid,
      pluginId: 'fiscal-printer',
      featureKey: 'fiscal-printer',
      message: message ?? (valid ? 'Licencia activa' : 'Licencia requerida'),
    }),
  } as unknown as LicenseManager
}

interface KernelMocks {
  fiscalPrinter?: IFiscalPrinter | null
  hasFiscal?: boolean
  basicPrinter?: IBasicPrinter | null
  hasBasic?: boolean
}

function mockKernel(opts: KernelMocks = {}): AppKernel {
  const {
    fiscalPrinter: fp = null,
    hasFiscal = false,
    basicPrinter: bp = null,
    hasBasic = false,
  } = opts

  return {
    getFiscalPrinter: vi.fn().mockReturnValue(fp),
    hasFiscalPrinterPlugin: vi.fn().mockReturnValue(hasFiscal || fp !== null),
    getBasicPrinter: vi.fn().mockReturnValue(bp),
    hasBasicPrinterPlugin: vi.fn().mockReturnValue(hasBasic || bp !== null),
  } as unknown as AppKernel
}

function mockFiscalPrinter(overrides: Partial<IFiscalPrinter> = {}): IFiscalPrinter {
  return {
    type: 'bixolon' as FiscalPrinterType,
    displayName: 'Bixolon SRP-350',
    testConnection: vi.fn().mockResolvedValue({ success: true }),
    printReceipt: vi.fn().mockResolvedValue({ success: true }),
    printInvoice: vi.fn().mockResolvedValue({ success: true }),
    openDrawer: vi.fn().mockResolvedValue({ success: true }),
    getStatus: vi.fn().mockResolvedValue({
      success: true,
      data: { online: true, paperOut: false, drawerOpen: false },
    }),
    ...overrides,
  }
}

function mockBasicPrinter(overrides: Partial<IBasicPrinter> = {}): IBasicPrinter {
  return {
    type: 'basic',
    displayName: 'Basic Printer (TCP)',
    testConnection: vi.fn().mockResolvedValue({ success: true }),
    printReceipt: vi.fn().mockResolvedValue({ success: true }),
    openDrawer: vi.fn().mockResolvedValue({ success: true }),
    getStatus: vi.fn().mockResolvedValue({
      success: true,
      data: { online: true, paperOut: false, drawerOpen: false },
    }),
    ...overrides,
  }
}

const mockReceiptData = {
  header: ['Mi Tienda', 'RIF J-12345678-9'],
  lines: [
    { type: 'item' as const, text: 'Producto A', quantity: 1, price: 100 },
    { type: 'total' as const, text: 'TOTAL: Bs. 100,00' },
  ],
  footer: ['Gracias por su compra'],
}

// ── handlePrinterTest ───────────────────────────────────────────

describe('handlePrinterTest', () => {
  it('returns plugin error when testConnection fails (fiscal)', async () => {
    const printer = mockFiscalPrinter({
      testConnection: vi.fn().mockResolvedValue({ success: false, error: 'PRINTER_NOT_FOUND' }),
    })
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: printer, hasFiscal: true })

    const result = await handlePrinterTest(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PRINTER_NOT_FOUND')
  })

  // ── Fallback chain: fiscal wins when licensed ──
  it('uses fiscal printer when licensed and active (fiscal wins over basic)', async () => {
    const fiscal = mockFiscalPrinter()
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: fiscal, hasFiscal: true, basicPrinter: basic, hasBasic: true })

    const result = await handlePrinterTest(kernel, lm)

    expect(result.success).toBe(true)
    expect(fiscal.testConnection).toHaveBeenCalledOnce()
    expect(basic.testConnection).not.toHaveBeenCalled()
  })

  // ── Fallback chain: fiscal unlicensed → basic ──
  it('falls back to basic printer when fiscal is unlicensed', async () => {
    const fiscal = mockFiscalPrinter()
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(false)
    const kernel = mockKernel({ fiscalPrinter: fiscal, hasFiscal: true, basicPrinter: basic, hasBasic: true })

    const result = await handlePrinterTest(kernel, lm)

    expect(result.success).toBe(true)
    expect(fiscal.testConnection).not.toHaveBeenCalled()
    expect(basic.testConnection).toHaveBeenCalledOnce()
    expect(lm.isFeatureEnabled).toHaveBeenCalledWith('fiscal-printer')
  })

  // ── Fallback chain: no fiscal → basic ──
  it('uses basic printer when no fiscal is registered', async () => {
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ basicPrinter: basic, hasBasic: true })

    const result = await handlePrinterTest(kernel, lm)

    expect(result.success).toBe(true)
    expect(basic.testConnection).toHaveBeenCalledOnce()
    expect(lm.isFeatureEnabled).not.toHaveBeenCalled()
  })

  // ── Fallback chain: no printer at all ──
  it('returns PLUGIN_NOT_AVAILABLE when no fiscal and no basic', async () => {
    const lm = mockLicenseManager(true)
    const kernel = mockKernel()

    const result = await handlePrinterTest(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PLUGIN_NOT_AVAILABLE')
  })

  it('returns PLUGIN_NOT_AVAILABLE when fiscal unlicensed and no basic', async () => {
    const fiscal = mockFiscalPrinter()
    const lm = mockLicenseManager(false)
    const kernel = mockKernel({ fiscalPrinter: fiscal, hasFiscal: true })

    const result = await handlePrinterTest(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PLUGIN_NOT_AVAILABLE')
  })

  // ── Fallback chain: fiscal registered but instance null → basic ──
  it('falls back to basic when fiscal is registered but instance is null', async () => {
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: null, hasFiscal: true, basicPrinter: basic, hasBasic: true })

    const result = await handlePrinterTest(kernel, lm)

    expect(result.success).toBe(true)
    expect(basic.testConnection).toHaveBeenCalledOnce()
  })
})

// ── handlePrintReceipt ─────────────────────────────────────────

describe('handlePrintReceipt', () => {
  it('maps PAPER_OUT error from fiscal plugin', async () => {
    const printer = mockFiscalPrinter({
      printReceipt: vi.fn().mockResolvedValue({ success: false, error: 'PAPER_OUT' }),
    })
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: printer, hasFiscal: true })

    const result = await handlePrintReceipt(kernel, lm, mockReceiptData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PAPER_OUT')
  })

  it('maps PRINT_FAILED error when fiscal plugin throws', async () => {
    const printer = mockFiscalPrinter({
      printReceipt: vi.fn().mockRejectedValue(new Error('Serial port disconnected')),
    })
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: printer, hasFiscal: true })

    const result = await handlePrintReceipt(kernel, lm, mockReceiptData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PRINT_FAILED')
  })

  it('delegates to fiscal plugin.printReceipt() when licensed', async () => {
    const printer = mockFiscalPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: printer, hasFiscal: true })

    const result = await handlePrintReceipt(kernel, lm, mockReceiptData)

    expect(result.success).toBe(true)
    expect(printer.printReceipt).toHaveBeenCalledWith(mockReceiptData)
  })

  // ── Fallback chain ──
  it('fiscal wins over basic when licensed', async () => {
    const fiscal = mockFiscalPrinter()
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: fiscal, hasFiscal: true, basicPrinter: basic, hasBasic: true })

    await handlePrintReceipt(kernel, lm, mockReceiptData)

    expect(fiscal.printReceipt).toHaveBeenCalledOnce()
    expect(basic.printReceipt).not.toHaveBeenCalled()
  })

  it('falls back to basic when fiscal is unlicensed', async () => {
    const fiscal = mockFiscalPrinter()
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(false)
    const kernel = mockKernel({ fiscalPrinter: fiscal, hasFiscal: true, basicPrinter: basic, hasBasic: true })

    const result = await handlePrintReceipt(kernel, lm, mockReceiptData)

    expect(result.success).toBe(true)
    expect(basic.printReceipt).toHaveBeenCalledWith(mockReceiptData)
    expect(fiscal.printReceipt).not.toHaveBeenCalled()
  })

  it('uses basic when no fiscal registered', async () => {
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ basicPrinter: basic, hasBasic: true })

    await handlePrintReceipt(kernel, lm, mockReceiptData)

    expect(basic.printReceipt).toHaveBeenCalledWith(mockReceiptData)
  })

  it('returns PLUGIN_NOT_AVAILABLE when no fiscal and no basic', async () => {
    const lm = mockLicenseManager(true)
    const kernel = mockKernel()

    const result = await handlePrintReceipt(kernel, lm, mockReceiptData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PLUGIN_NOT_AVAILABLE')
  })

  it('returns PLUGIN_NOT_AVAILABLE when fiscal unlicensed and no basic', async () => {
    const fiscal = mockFiscalPrinter()
    const lm = mockLicenseManager(false)
    const kernel = mockKernel({ fiscalPrinter: fiscal, hasFiscal: true })

    const result = await handlePrintReceipt(kernel, lm, mockReceiptData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PLUGIN_NOT_AVAILABLE')
  })

  it('falls back to basic when fiscal instance is null', async () => {
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: null, hasFiscal: true, basicPrinter: basic, hasBasic: true })

    await handlePrintReceipt(kernel, lm, mockReceiptData)

    expect(basic.printReceipt).toHaveBeenCalledOnce()
  })

  it('maps error from basic plugin printReceipt', async () => {
    const basic = mockBasicPrinter({
      printReceipt: vi.fn().mockResolvedValue({ success: false, error: 'PRINT_FAILED' }),
    })
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ basicPrinter: basic, hasBasic: true })

    const result = await handlePrintReceipt(kernel, lm, mockReceiptData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PRINT_FAILED')
  })
})

// ── handlePrinterStatus ────────────────────────────────────────

describe('handlePrinterStatus', () => {
  it('returns status data from fiscal plugin.getStatus()', async () => {
    const printer = mockFiscalPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: printer, hasFiscal: true })

    const result = await handlePrinterStatus(kernel, lm)

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ online: true, paperOut: false, drawerOpen: false })
    expect(printer.getStatus).toHaveBeenCalledOnce()
  })

  it('returns PRINTER_NOT_FOUND when fiscal getStatus fails', async () => {
    const printer = mockFiscalPrinter({
      getStatus: vi.fn().mockRejectedValue(new Error('disconnected')),
    })
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: printer, hasFiscal: true })

    const result = await handlePrinterStatus(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PRINTER_NOT_FOUND')
  })

  // ── Fallback chain ──
  it('fiscal wins over basic when licensed', async () => {
    const fiscal = mockFiscalPrinter()
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: fiscal, hasFiscal: true, basicPrinter: basic, hasBasic: true })

    await handlePrinterStatus(kernel, lm)

    expect(fiscal.getStatus).toHaveBeenCalledOnce()
    expect(basic.getStatus).not.toHaveBeenCalled()
  })

  it('falls back to basic when fiscal is unlicensed', async () => {
    const fiscal = mockFiscalPrinter()
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(false)
    const kernel = mockKernel({ fiscalPrinter: fiscal, hasFiscal: true, basicPrinter: basic, hasBasic: true })

    const result = await handlePrinterStatus(kernel, lm)

    expect(result.success).toBe(true)
    expect(basic.getStatus).toHaveBeenCalledOnce()
    expect(fiscal.getStatus).not.toHaveBeenCalled()
  })

  it('uses basic when no fiscal registered', async () => {
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ basicPrinter: basic, hasBasic: true })

    const result = await handlePrinterStatus(kernel, lm)

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ online: true, paperOut: false, drawerOpen: false })
    expect(basic.getStatus).toHaveBeenCalledOnce()
  })

  it('returns PLUGIN_NOT_AVAILABLE when no fiscal and no basic', async () => {
    const lm = mockLicenseManager(true)
    const kernel = mockKernel()

    const result = await handlePrinterStatus(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PLUGIN_NOT_AVAILABLE')
  })

  it('falls back to basic when fiscal instance is null', async () => {
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: null, hasFiscal: true, basicPrinter: basic, hasBasic: true })

    await handlePrinterStatus(kernel, lm)

    expect(basic.getStatus).toHaveBeenCalledOnce()
  })

  it('returns error from basic plugin getStatus', async () => {
    const basic = mockBasicPrinter({
      getStatus: vi.fn().mockResolvedValue({ success: false, error: 'PRINTER_NOT_FOUND' }),
    })
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ basicPrinter: basic, hasBasic: true })

    const result = await handlePrinterStatus(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PRINTER_NOT_FOUND')
  })
})

// ── handleOpenDrawer ───────────────────────────────────────────

describe('handleOpenDrawer', () => {
  it('delegates to fiscal plugin.openDrawer() when licensed', async () => {
    const printer = mockFiscalPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: printer, hasFiscal: true })

    const result = await handleOpenDrawer(kernel, lm)

    expect(result.success).toBe(true)
    expect(printer.openDrawer).toHaveBeenCalledOnce()
  })

  it('returns PRINTER_NOT_FOUND when fiscal openDrawer throws', async () => {
    const printer = mockFiscalPrinter({
      openDrawer: vi.fn().mockRejectedValue(new Error('drawer jammed')),
    })
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: printer, hasFiscal: true })

    const result = await handleOpenDrawer(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PRINTER_NOT_FOUND')
  })

  // ── Fallback chain ──
  it('fiscal wins over basic when licensed', async () => {
    const fiscal = mockFiscalPrinter()
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: fiscal, hasFiscal: true, basicPrinter: basic, hasBasic: true })

    await handleOpenDrawer(kernel, lm)

    expect(fiscal.openDrawer).toHaveBeenCalledOnce()
    expect(basic.openDrawer).not.toHaveBeenCalled()
  })

  it('falls back to basic when fiscal is unlicensed', async () => {
    const fiscal = mockFiscalPrinter()
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(false)
    const kernel = mockKernel({ fiscalPrinter: fiscal, hasFiscal: true, basicPrinter: basic, hasBasic: true })

    const result = await handleOpenDrawer(kernel, lm)

    expect(result.success).toBe(true)
    expect(basic.openDrawer).toHaveBeenCalledOnce()
    expect(fiscal.openDrawer).not.toHaveBeenCalled()
  })

  it('uses basic when no fiscal registered', async () => {
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ basicPrinter: basic, hasBasic: true })

    await handleOpenDrawer(kernel, lm)

    expect(basic.openDrawer).toHaveBeenCalledOnce()
  })

  it('returns PLUGIN_NOT_AVAILABLE when no fiscal and no basic', async () => {
    const lm = mockLicenseManager(true)
    const kernel = mockKernel()

    const result = await handleOpenDrawer(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PLUGIN_NOT_AVAILABLE')
  })

  it('falls back to basic when fiscal instance is null', async () => {
    const basic = mockBasicPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ fiscalPrinter: null, hasFiscal: true, basicPrinter: basic, hasBasic: true })

    await handleOpenDrawer(kernel, lm)

    expect(basic.openDrawer).toHaveBeenCalledOnce()
  })

  it('returns error from basic plugin openDrawer', async () => {
    const basic = mockBasicPrinter({
      openDrawer: vi.fn().mockRejectedValue(new Error('drawer disconnected')),
    })
    const lm = mockLicenseManager(true)
    const kernel = mockKernel({ basicPrinter: basic, hasBasic: true })

    const result = await handleOpenDrawer(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PRINTER_NOT_FOUND')
  })
})

// ── handleCheckPrinterLicense ──────────────────────────────────

describe('handleCheckPrinterLicense', () => {
  it('returns valid: true when license is active', async () => {
    const lm = mockLicenseManager(true, 'Licencia activa (perpetua)')

    const result = await handleCheckPrinterLicense(lm)

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ valid: true, message: 'Licencia activa (perpetua)' })
  })

  it('returns valid: false when license is missing', async () => {
    const lm = mockLicenseManager(false, 'Se requiere licencia para: Impresora Fiscal')

    const result = await handleCheckPrinterLicense(lm)

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ valid: false, message: 'Se requiere licencia para: Impresora Fiscal' })
  })
})
