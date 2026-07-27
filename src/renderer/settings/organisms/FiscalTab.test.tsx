import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FiscalTab from './FiscalTab'

const MOCK_FISCAL_CONFIG = {
  printerType: 'bixolon',
  printerPort: 'COM1',
  printerEnabled: true,
  seniatEnabled: false,
  autoSendSeniat: false,
}

const MOCK_COUNTRY_PLUGIN = {
  countryCode: 'VE',
  countryName: 'Venezuela',
  currencySymbol: 'Bs.',
  currencyCode: 'VES',
  taxIdLabel: 'RIF',
  paymentMethods: [],
  defaultTaxes: [],
  defaultExchangeRate: 50,
  fiscalAuthority: {
    name: 'SENIAT',
    description: 'Facturación electrónica',
    electronicInvoiceLabel: 'Facturación electrónica',
    electronicInvoiceDescription: 'Enviar facturas al SENIAT',
    autoSendLabel: 'Envío automático',
    autoSendDescription: 'Enviar automáticamente al emitir',
  },
  personTypes: [],
}

beforeEach(() => {
  window.electronAPI.getFiscalConfig = vi.fn().mockResolvedValue({
    success: true,
    data: MOCK_FISCAL_CONFIG,
  })
  window.electronAPI.updateFiscalConfig = vi.fn().mockResolvedValue({ success: true })
  window.electronAPI.testPrinter = vi.fn().mockResolvedValue({ success: true })
  window.electronAPI.getPrinterStatus = vi.fn().mockResolvedValue({
    success: true,
    data: { online: true, paperOut: false, drawerOpen: false },
  })
  window.electronAPI.checkPrinterLicense = vi.fn().mockResolvedValue({
    success: true,
    data: { valid: true, message: 'Licencia activa (perpetua)' },
  })
  window.electronAPI.getCountryPlugin = vi.fn().mockResolvedValue({
    success: true,
    data: MOCK_COUNTRY_PLUGIN,
  })
  window.electronAPI.getCountryConfig = vi.fn().mockResolvedValue({
    success: true,
    data: { country: 'VE' },
  })
})

describe('FiscalTab', () => {
  it('renders the printer section heading', async () => {
    render(<FiscalTab />)

    await waitFor(() => {
      expect(screen.getByText('Impresora fiscal')).toBeInTheDocument()
    })
  })

  it('shows "Probar conexión" button', async () => {
    render(<FiscalTab />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Probar conexión' })).toBeInTheDocument()
    })
  })

  it('test button displays success message after successful test', async () => {
    const user = userEvent.setup()
    render(<FiscalTab />)

    await waitFor(() => {
      expect(screen.getByText('Impresora fiscal')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Probar conexión' }))

    await waitFor(() => {
      expect(screen.getByText('Conexión exitosa')).toBeInTheDocument()
    })
  })

  it('test button displays error message after failed test', async () => {
    window.electronAPI.testPrinter = vi.fn().mockResolvedValue({
      success: false,
      error: 'PRINTER_NOT_FOUND',
    })

    const user = userEvent.setup()
    render(<FiscalTab />)

    await waitFor(() => {
      expect(screen.getByText('Impresora fiscal')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Probar conexión' }))

    await waitFor(() => {
      expect(screen.getByText('Impresora no encontrada')).toBeInTheDocument()
    })
  })

  it('test button shows license error when no license', async () => {
    window.electronAPI.testPrinter = vi.fn().mockResolvedValue({
      success: false,
      error: 'LICENSE_REQUIRED',
    })

    const user = userEvent.setup()
    render(<FiscalTab />)

    await waitFor(() => {
      expect(screen.getByText('Impresora fiscal')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Probar conexión' }))

    await waitFor(() => {
      expect(screen.getByText('Se requiere licencia')).toBeInTheDocument()
    })
  })

  it('shows printer online indicator', async () => {
    render(<FiscalTab />)

    await waitFor(() => {
      expect(screen.getByText('En línea')).toBeInTheDocument()
    })
  })

  it('shows printer offline indicator', async () => {
    window.electronAPI.getPrinterStatus = vi.fn().mockResolvedValue({
      success: true,
      data: { online: false, paperOut: false, drawerOpen: false },
    })

    render(<FiscalTab />)

    await waitFor(() => {
      expect(screen.getByText('Sin conexión')).toBeInTheDocument()
    })
  })

  it('shows paper-out warning', async () => {
    window.electronAPI.getPrinterStatus = vi.fn().mockResolvedValue({
      success: true,
      data: { online: true, paperOut: true, drawerOpen: false },
    })

    render(<FiscalTab />)

    await waitFor(() => {
      expect(screen.getByText('⚠ Sin papel')).toBeInTheDocument()
    })
  })

  it('printer toggle is disabled when license is invalid', async () => {
    window.electronAPI.checkPrinterLicense = vi.fn().mockResolvedValue({
      success: true,
      data: { valid: false, message: 'Licencia requerida' },
    })

    render(<FiscalTab />)

    await waitFor(() => {
      const toggle = screen.getByRole('switch', { name: 'Habilitar impresora fiscal' })
      expect(toggle).toBeDisabled()
    })
  })

  it('printer toggle is enabled when license is valid', async () => {
    render(<FiscalTab />)

    await waitFor(() => {
      const toggle = screen.getByRole('switch', { name: 'Habilitar impresora fiscal' })
      expect(toggle).not.toBeDisabled()
    })
  })

  it('test button is disabled when printer is not enabled', async () => {
    window.electronAPI.getFiscalConfig = vi.fn().mockResolvedValue({
      success: true,
      data: { ...MOCK_FISCAL_CONFIG, printerEnabled: false },
    })

    render(<FiscalTab />)

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: 'Probar conexión' })
      expect(btn).toBeDisabled()
    })
  })

  it('renders printer type and port fields', async () => {
    render(<FiscalTab />)

    await waitFor(() => {
      expect(screen.getByText('Tipo de impresora')).toBeInTheDocument()
      expect(screen.getByText('Puerto')).toBeInTheDocument()
    })
  })
})
