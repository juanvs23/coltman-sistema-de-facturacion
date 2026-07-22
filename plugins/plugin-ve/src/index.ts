import type { IPlugin, PluginManifest, PluginResult } from '@sistema-facturacion/plugin-api'
import type { ICountryPlugin, TaxIdValidation, PaymentMethod, DefaultTax } from '@sistema-facturacion/plugin-api'
import { validateRif, formatRif } from './rif'
import { getReceiptFooter } from './footer'

const manifest: PluginManifest = {
  id: 'plugin-ve',
  name: 'Regionalización Venezuela',
  version: '1.0.0',
  description: 'Configuración fiscal y regional para Venezuela',
  author: 'Tu Empresa',
  visibility: 'free',
  target: 'main',
  hooks: []
}

export default class VenezuelaPlugin implements IPlugin, ICountryPlugin {
  manifest = manifest
  countryCode = 'VE'
  countryName = 'Venezuela'
  currencySymbol = 'Bs.'
  currencyCode = 'VES'
  taxIdLabel = 'RIF'

  validateTaxId(taxId: string): TaxIdValidation {
    return validateRif(taxId)
  }

  formatTaxId(raw: string): string {
    return formatRif(raw)
  }

  formatCurrency(amount: number): string {
    return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  getDefaultTaxes(): DefaultTax[] {
    return [
      { name: 'IVA General 16%', rate: 16.0, description: 'Impuesto al Valor Agregado 16%' },
      { name: 'IVA Reducido 8%', rate: 8.0, description: 'IVA reducido para rubros seleccionados' },
      { name: 'Exento', rate: 0.0, description: 'Productos exentos de IVA' }
    ]
  }

  getPaymentMethods(): PaymentMethod[] {
    return [
      { id: 'CASH', label: 'Efectivo' },
      { id: 'TRANSFER', label: 'Transferencia / Pago Móvil' },
      { id: 'DEBIT_CARD', label: 'Tarjeta de Débito' },
      { id: 'CREDIT_CARD', label: 'Tarjeta de Crédito' },
      { id: 'DIVISA', label: 'Divisa (USD)' },
      { id: 'MIXED', label: 'Mixto' }
    ]
  }

  getReceiptFooter(documentType?: 'FACTURA' | 'TICKET'): { lines: string[] } {
    const lines = getReceiptFooter(documentType ?? 'TICKET')
    return { lines }
  }

  getDefaultExchangeRate(): number | null {
    return 48.50
  }

  getInvoiceNumberFormat?(): { prefix: string; startAt: number } {
    return { prefix: 'F-', startAt: 1 }
  }

  async activate(): Promise<PluginResult> {
    console.log('[plugin-ve] VenezuelaPlugin activated')
    return { success: true }
  }

  async deactivate(): Promise<PluginResult> {
    console.log('[plugin-ve] VenezuelaPlugin deactivated')
    return { success: true }
  }
}
