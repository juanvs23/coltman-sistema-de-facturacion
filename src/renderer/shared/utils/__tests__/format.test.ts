import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../format'

describe('formatCurrency', () => {
  it('formats with default Bs. symbol', () => {
    expect(formatCurrency(1234.56)).toBe('Bs. 1234.56')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('Bs. 0.00')
  })

  it('formats with custom symbol', () => {
    expect(formatCurrency(50, '$')).toBe('$ 50.00')
    expect(formatCurrency(99.99, 'COL$')).toBe('COL$ 99.99')
    expect(formatCurrency(1000, 'MXN$')).toBe('MXN$ 1000.00')
  })

  it('rounds to two decimal places', () => {
    expect(formatCurrency(10.556)).toBe('Bs. 10.56')
    expect(formatCurrency(10.554)).toBe('Bs. 10.55')
  })
})
