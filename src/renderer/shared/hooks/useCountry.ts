import { useState, useEffect, useCallback } from 'react'

export interface CountryInfo {
  countryCode: string
  countryName: string
  currencySymbol: string
  currencyCode: string
  taxIdLabel: string
  paymentMethods: Array<{ id: string; label: string }>
  defaultTaxes: Array<{ name: string; rate: number; description?: string }>
  defaultExchangeRate: number | null
  loading: boolean
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
  loading: false
}

/**
 * Hook that fetches the active country plugin data from the kernel via IPC.
 * Returns neutral defaults when no country plugin is active.
 */
export function useCountry(): CountryInfo {
  const [country, setCountry] = useState<CountryInfo>({ ...NEUTRAL, loading: true })

  const load = useCallback(async () => {
    try {
      const [pluginRes, configRes] = await Promise.all([
        window.electronAPI.getCountryPlugin(),
        window.electronAPI.getCountryConfig()
      ])

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
          loading: false
        })
      } else {
        // No plugin active — use neutral defaults, derive country from config
        const configCountry = configRes.success && configRes.data ? configRes.data.country : ''
        setCountry({
          ...NEUTRAL,
          countryCode: configCountry,
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
