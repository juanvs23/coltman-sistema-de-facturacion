import { describe, it, expect, vi, beforeEach } from 'vitest'
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

function mockKernel(printer: IFiscalPrinter | null, hasPlugin = false): AppKernel {
  return {
    getFiscalPrinter: vi.fn().mockReturnValue(printer),
    hasFiscalPrinterPlugin: vi.fn().mockReturnValue(hasPlugin || printer !== null),
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

describe('handlePrinterTest', () => {
  it('rejects with LICENSE_REQUIRED when license is not valid', async () => {
    const lm = mockLicenseManager(false)
    const kernel = mockKernel(null)

    const result = await handlePrinterTest(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('LICENSE_REQUIRED')
    expect(lm.isFeatureEnabled).toHaveBeenCalledWith('fiscal-printer')
  })

  it('rejects with PLUGIN_NOT_AVAILABLE when no fiscal printer is registered', async () => {
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(null)

    const result = await handlePrinterTest(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PLUGIN_NOT_AVAILABLE')
  })

  it('rejects with PLUGIN_NOT_ACTIVE when plugin is registered but instance is not active', async () => {
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(null, true)

    const result = await handlePrinterTest(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PLUGIN_NOT_ACTIVE')
  })

  it('delegates to plugin.testConnection() when license and printer are valid', async () => {
    const printer = mockFiscalPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(printer)

    const result = await handlePrinterTest(kernel, lm)

    expect(result.success).toBe(true)
    expect(printer.testConnection).toHaveBeenCalledOnce()
  })

  it('returns plugin error when testConnection fails', async () => {
    const printer = mockFiscalPrinter({
      testConnection: vi.fn().mockResolvedValue({ success: false, error: 'PRINTER_NOT_FOUND' }),
    })
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(printer)

    const result = await handlePrinterTest(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PRINTER_NOT_FOUND')
  })
})

describe('handlePrintReceipt', () => {
  const mockReceiptData = {
    header: ['Mi Tienda', 'RIF J-12345678-9'],
    lines: [
      { type: 'item' as const, text: 'Producto A', quantity: 1, price: 100 },
      { type: 'total' as const, text: 'TOTAL: Bs. 100,00' },
    ],
    footer: ['Gracias por su compra'],
  }

  it('rejects with LICENSE_REQUIRED when license is not valid', async () => {
    const lm = mockLicenseManager(false)
    const kernel = mockKernel(null)

    const result = await handlePrintReceipt(kernel, lm, mockReceiptData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('LICENSE_REQUIRED')
    expect(lm.isFeatureEnabled).toHaveBeenCalledWith('fiscal-printer')
  })

  it('rejects with PLUGIN_NOT_AVAILABLE when no fiscal printer is registered', async () => {
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(null)

    const result = await handlePrintReceipt(kernel, lm, { header: [], lines: [], footer: [] })

    expect(result.success).toBe(false)
    expect(result.error).toBe('PLUGIN_NOT_AVAILABLE')
  })

  it('rejects with PLUGIN_NOT_ACTIVE when plugin is registered but instance is not active', async () => {
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(null, true)

    const result = await handlePrintReceipt(kernel, lm, { header: [], lines: [], footer: [] })

    expect(result.success).toBe(false)
    expect(result.error).toBe('PLUGIN_NOT_ACTIVE')
  })

  it('delegates to plugin.printReceipt() when license and printer are valid', async () => {
    const printer = mockFiscalPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(printer)

    const result = await handlePrintReceipt(kernel, lm, mockReceiptData)

    expect(result.success).toBe(true)
    expect(printer.printReceipt).toHaveBeenCalledWith(mockReceiptData)
  })

  it('maps PAPER_OUT error from plugin', async () => {
    const printer = mockFiscalPrinter({
      printReceipt: vi.fn().mockResolvedValue({ success: false, error: 'PAPER_OUT' }),
    })
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(printer)

    const result = await handlePrintReceipt(kernel, lm, mockReceiptData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PAPER_OUT')
  })

  it('maps PRINT_FAILED error when plugin throws', async () => {
    const printer = mockFiscalPrinter({
      printReceipt: vi.fn().mockRejectedValue(new Error('Serial port disconnected')),
    })
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(printer)

    const result = await handlePrintReceipt(kernel, lm, mockReceiptData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PRINT_FAILED')
  })
})

describe('handlePrinterStatus', () => {
  it('rejects with LICENSE_REQUIRED when license is not valid', async () => {
    const lm = mockLicenseManager(false)
    const kernel = mockKernel(null)

    const result = await handlePrinterStatus(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('LICENSE_REQUIRED')
  })

  it('rejects with PLUGIN_NOT_AVAILABLE when no fiscal printer is registered', async () => {
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(null)

    const result = await handlePrinterStatus(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PLUGIN_NOT_AVAILABLE')
  })

  it('rejects with PLUGIN_NOT_ACTIVE when plugin is registered but instance is not active', async () => {
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(null, true)

    const result = await handlePrinterStatus(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PLUGIN_NOT_ACTIVE')
  })

  it('returns status data from plugin.getStatus()', async () => {
    const printer = mockFiscalPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(printer)

    const result = await handlePrinterStatus(kernel, lm)

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ online: true, paperOut: false, drawerOpen: false })
    expect(printer.getStatus).toHaveBeenCalledOnce()
  })

  it('returns PRINTER_NOT_FOUND when getStatus fails', async () => {
    const printer = mockFiscalPrinter({
      getStatus: vi.fn().mockRejectedValue(new Error('disconnected')),
    })
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(printer)

    const result = await handlePrinterStatus(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PRINTER_NOT_FOUND')
  })
})

describe('handleOpenDrawer', () => {
  it('rejects with LICENSE_REQUIRED when license is not valid', async () => {
    const lm = mockLicenseManager(false)
    const kernel = mockKernel(null)

    const result = await handleOpenDrawer(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('LICENSE_REQUIRED')
  })

  it('rejects with PLUGIN_NOT_AVAILABLE when no fiscal printer is registered', async () => {
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(null)

    const result = await handleOpenDrawer(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PLUGIN_NOT_AVAILABLE')
  })

  it('rejects with PLUGIN_NOT_ACTIVE when plugin is registered but instance is not active', async () => {
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(null, true)

    const result = await handleOpenDrawer(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PLUGIN_NOT_ACTIVE')
  })

  it('delegates to plugin.openDrawer() when license and printer are valid', async () => {
    const printer = mockFiscalPrinter()
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(printer)

    const result = await handleOpenDrawer(kernel, lm)

    expect(result.success).toBe(true)
    expect(printer.openDrawer).toHaveBeenCalledOnce()
  })

  it('returns PRINTER_NOT_FOUND when openDrawer throws', async () => {
    const printer = mockFiscalPrinter({
      openDrawer: vi.fn().mockRejectedValue(new Error('drawer jammed')),
    })
    const lm = mockLicenseManager(true)
    const kernel = mockKernel(printer)

    const result = await handleOpenDrawer(kernel, lm)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PRINTER_NOT_FOUND')
  })
})

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
