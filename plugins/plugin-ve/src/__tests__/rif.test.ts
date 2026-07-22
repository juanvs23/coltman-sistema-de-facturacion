import { describe, it, expect } from 'vitest'
import { validateRif, formatRif } from '../rif'

describe('validateRif', () => {
  it('accepts a valid RIF J-', () => {
    expect(validateRif('J-12345678-4').valid).toBe(true)
  })

  it('accepts a valid RIF V-', () => {
    expect(validateRif('V-12345678-1').valid).toBe(true)
  })

  it('rejects invalid format', () => {
    expect(validateRif('123456789').valid).toBe(false)
    expect(validateRif('J-123-9').valid).toBe(false)
    expect(validateRif('').valid).toBe(false)
  })

  it('rejects wrong check digit', () => {
    const result = validateRif('J-12345678-9')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Dígito verificador')
  })
})

describe('formatRif', () => {
  it('formats a raw RIF string', () => {
    expect(formatRif('J123456784')).toBe('J-12345678-4')
  })

  it('handles already formatted RIF', () => {
    expect(formatRif('J-12345678-4')).toBe('J-12345678-4')
  })
})
