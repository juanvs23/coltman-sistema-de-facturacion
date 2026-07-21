import type { ICountryPlugin } from '@sistema-facturacion/plugin-api'
import { validateRif, formatRif, getReceiptFooter } from '@shared/country/ve'
import type { PrismaClient } from '@prisma/client'

export class VenezuelaPlugin implements ICountryPlugin {
  countryCode = 'VE'
  countryName = 'Venezuela'
  currencySymbol = 'Bs.'
  currencyCode = 'VES'
  taxIdLabel = 'RIF'
  private usdRateHistory: Array<{ rate: number; source: string; date: string }> = []

  constructor(private prisma?: PrismaClient) {}

  validateTaxId(taxId: string) {
    return validateRif(taxId)
  }

  formatTaxId(raw: string) {
    return formatRif(raw)
  }

  formatCurrency(amount: number): string {
    return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  getDefaultTaxes() {
    return [
      { name: 'IVA General 16%', rate: 16.0, description: 'Impuesto al Valor Agregado 16%' },
      { name: 'IVA Reducido 8%', rate: 8.0, description: 'IVA reducido para rubros seleccionados' },
      { name: 'Exento', rate: 0.0, description: 'Productos exentos de IVA' }
    ]
  }

  getPaymentMethods() {
    return [
      { id: 'CASH', label: 'Efectivo' },
      { id: 'TRANSFER', label: 'Transferencia / Pago Móvil' },
      { id: 'DEBIT_CARD', label: 'Tarjeta de Débito' },
      { id: 'CREDIT_CARD', label: 'Tarjeta de Crédito' },
      { id: 'DIVISA', label: 'Divisa (USD)' },
      { id: 'MIXED', label: 'Mixto' }
    ]
  }

  getReceiptFooter(documentType?: 'FACTURA' | 'TICKET') {
    const lines = getReceiptFooter(documentType ?? 'TICKET')
    return { lines }
  }

  getDefaultExchangeRate(): number {
    return 48.50
  }

  async getRateHistory(): Promise<Array<{ rate: number; source: string; date: string }>> {
    if (this.prisma) {
      const rates = await this.prisma.usdRate.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { rate: true, source: true, createdAt: true }
      })
      return rates.map((r) => ({
        rate: r.rate,
        source: r.source,
        date: r.createdAt.toISOString()
      }))
    }
    return this.usdRateHistory
  }
}
