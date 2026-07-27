import { useState, useEffect, useCallback } from 'react'

export interface FiscalAuthorityInfo {
  name: string
  description: string
  electronicInvoiceLabel: string
  electronicInvoiceDescription: string
  autoSendLabel: string
  autoSendDescription: string
}

export interface CountryInfo {
  countryCode: string
  countryName: string
  currencySymbol: string
  currencyCode: string
  taxIdLabel: string
  paymentMethods: Array<{ id: string; label: string }>
  defaultTaxes: Array<{ name: string; rate: number; description?: string }>
  defaultExchangeRate: number | null
  usdRate: number
  fiscalAuthority?: FiscalAuthorityInfo
  loading: boolean
  validateTaxId: (taxId: string) => { valid: boolean; error?: string }
  formatTaxId: (taxId: string) => string
  getPersonTypes: () => Array<{ value: string; label: string; subtypes: Array<{ value: string; label: string }> }>
}

const NEUTRAL: CountryInfo = {
  countryCode: '',
  countryName: '',
  currencySymbol: '$',
  currencyCode: 'USD',
  taxIdLabel: 'Tax ID',
  paymentMethods: [
    { id: 'CASH', label: 'Efectivo' },
    { id: 'TRANSFER', label: 'Transferencia' },
    { id: 'DEBIT_CARD', label: 'Tarjeta de Debito' },
    { id: 'CREDIT_CARD', label: 'Tarjeta de Credito' }
  ],
  defaultTaxes: [],
  defaultExchangeRate: null,
  usdRate: 1,
  fiscalAuthority: undefined,
  loading: false,
  validateTaxId: (taxId: string) => ({ valid: /^[VEJGP]-\d{7,8}-\d$/.test(taxId) }),
  formatTaxId: (taxId: string) => {
    const c = taxId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    return c.length === 10 ? `${c[0]}-${c.slice(1, 9)}-${c.slice(9)}` : taxId
  },
  getPersonTypes: () => []
}

/**
 * Hook that fetches the active country plugin data from the kernel via IPC.
 * Returns neutral defaults when no country plugin is active.
 */
export function useCountry(): CountryInfo {
  const [country, setCountry] = useState<CountryInfo>({ ...NEUTRAL, loading: true })

  const load = useCallback(async () => {
    try {
      const [pluginRes, rateRes] = await Promise.all([
        window.electronAPI.getCountryPlugin(),
        window.electronAPI.getUsdRate().catch(() => ({ success: false }))
      ])

      const usdRate = rateRes.success && rateRes.data?.rate ? rateRes.data.rate : 1

      if (pluginRes.success && pluginRes.data) {
        setCountry({
          countryCode: pluginRes.data.countryCode,
          countryName: pluginRes.data.countryName,
          currencySymbol: pluginRes.data.currencySymbol,
          currencyCode: pluginRes.data.currencyCode,
          taxIdLabel: pluginRes.data.taxIdLabel,
          paymentMethods: pluginRes.data.paymentMethods,
          defaultTaxes: pluginRes.data.defaultTaxes,
          defaultExchangeRate: pluginRes.data.defaultExchangeRate,
          fiscalAuthority: pluginRes.data.fiscalAuthority,
          usdRate,
          loading: false,
          validateTaxId: NEUTRAL.validateTaxId,
          formatTaxId: NEUTRAL.formatTaxId,
          getPersonTypes: () => pluginRes.data?.personTypes ?? []
        })
      } else {
        setCountry({
          ...NEUTRAL,
          usdRate,
          loading: false
        })
      }
    } catch {
      setCountry({ ...NEUTRAL, loading: false })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return country
}

// CountryPluginData is defined in src/renderer/shared/types/electron.d.ts
