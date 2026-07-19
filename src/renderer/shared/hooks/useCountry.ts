import { useState, useEffect } from 'react'
import type { TaxIdValidation } from '@sistema-facturacion/plugin-api'

export interface CountryData {
  code: string
  taxIdLabel: string
  currencySymbol: string
  currencyCode: string
  paymentMethods: Array<{ id: string; label: string }>
  receiptFooter: string[]
  validateTaxId: (taxId: string) => TaxIdValidation
  formatTaxId: (raw: string) => string
  formatCurrency: (amount: number) => string
}

const NEUTRAL: CountryData = {
  code: '',
  taxIdLabel: 'ID Fiscal',
  currencySymbol: '$',
  currencyCode: 'USD',
  paymentMethods: [
    { id: 'CASH', label: 'Efectivo' },
    { id: 'TRANSFER', label: 'Transferencia' },
    { id: 'DEBIT_CARD', label: 'Tarjeta de Débito' },
    { id: 'CREDIT_CARD', label: 'Tarjeta de Crédito' }
  ],
  receiptFooter: ['Gracias por su compra'],
  validateTaxId: () => ({ valid: true }),
  formatTaxId: (raw: string) => raw,
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`
}

async function loadCountryData(): Promise<CountryData> {
  try {
    const res = await window.electronAPI.listPlugins()
    if (!res.success || !res.data) return NEUTRAL

    for (const plugin of res.data) {
      if (!plugin.enabled) continue
      const match = plugin.id.match(/^plugin-([a-z]{2})$/)
      if (!match) continue
      const code = match[1].toUpperCase()

      if (code === 'VE') {
        const ve = await import('@shared/country/ve')
        return {
          code: 'VE', taxIdLabel: ve.TAX_ID_LABEL, currencySymbol: ve.CURRENCY_SYMBOL,
          currencyCode: ve.CURRENCY_CODE, paymentMethods: ve.PAYMENT_METHODS,
          receiptFooter: ve.RECEIPT_FOOTER, validateTaxId: ve.validateRif,
          formatTaxId: ve.formatRif, formatCurrency: ve.formatCurrency
        }
      }
      if (code === 'CO') {
        const co = await import('@shared/country/co')
        return {
          code: 'CO', taxIdLabel: co.TAX_ID_LABEL, currencySymbol: co.CURRENCY_SYMBOL,
          currencyCode: co.CURRENCY_CODE, paymentMethods: co.PAYMENT_METHODS,
          receiptFooter: co.RECEIPT_FOOTER, validateTaxId: co.validateNit,
          formatTaxId: co.formatNit, formatCurrency: co.formatCurrency
        }
      }
    }
    return NEUTRAL
  } catch {
    return NEUTRAL
  }
}

/** Hook que carga el país activo una vez al montar. Si se cambia el plugin, la app se reinicia. */
export function useCountry(): CountryData {
  const [country, setCountry] = useState<CountryData>(NEUTRAL)

  useEffect(() => {
    loadCountryData().then(setCountry)
  }, [])

  return country
}
