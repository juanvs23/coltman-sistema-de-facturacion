import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCountry } from '../useCountry'

describe('useCountry', () => {
  beforeEach(() => {
    // Reset mock to default: no country plugin
    window.electronAPI.getCountryPlugin = vi.fn().mockResolvedValue({ success: true, data: null })
    window.electronAPI.getCountryConfig = vi.fn().mockResolvedValue({ success: true, data: { country: 'VE' } })
  })

  it('returns neutral defaults when no plugin is active', async () => {
    const { result } = renderHook(() => useCountry())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.currencySymbol).toBe('$')
    expect(result.current.taxIdLabel).toBe('Tax ID')
    expect(result.current.countryCode).toBe('VE') // from config
    expect(result.current.paymentMethods).toHaveLength(4)
  })

  it('returns country data when plugin is active', async () => {
    const mockPlugin = {
      countryCode: 'CO',
      countryName: 'Colombia',
      currencySymbol: 'COL$',
      currencyCode: 'COP',
      taxIdLabel: 'NIT',
      paymentMethods: [{ id: 'CASH', label: 'Efectivo' }],
      defaultTaxes: [{ name: 'IVA 19%', rate: 19 }],
      defaultExchangeRate: null
    }

    window.electronAPI.getCountryPlugin = vi.fn().mockResolvedValue({ success: true, data: mockPlugin })

    const { result } = renderHook(() => useCountry())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.currencySymbol).toBe('COL$')
    expect(result.current.taxIdLabel).toBe('NIT')
    expect(result.current.countryCode).toBe('CO')
    expect(result.current.paymentMethods).toHaveLength(1)
    expect(result.current.defaultTaxes).toHaveLength(1)
    expect(result.current.defaultTaxes[0].rate).toBe(19)
  })

  it('handles IPC error gracefully', async () => {
    window.electronAPI.getCountryPlugin = vi.fn().mockRejectedValue(new Error('IPC failed'))

    const { result } = renderHook(() => useCountry())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.currencySymbol).toBe('$')
    expect(result.current.taxIdLabel).toBe('Tax ID')
    expect(result.current.loading).toBe(false)
  })
})
