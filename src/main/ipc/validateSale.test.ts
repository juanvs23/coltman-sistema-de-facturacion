import { describe, it, expect } from 'vitest'
import { validateSaleInput } from './handlers'

describe('validateSaleInput', () => {
  it('rejects FACTURA without customerId', () => {
    const result = validateSaleInput({ documentType: 'FACTURA' })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('CUSTOMER_REQUIRED_FOR_FACTURA')
  })

  it('accepts FACTURA with customerId', () => {
    const result = validateSaleInput({ documentType: 'FACTURA', customerId: 'cust-1' })
    expect(result.valid).toBe(true)
  })

  it('accepts TICKET without customerId', () => {
    const result = validateSaleInput({ documentType: 'TICKET' })
    expect(result.valid).toBe(true)
  })

  it('accepts TICKET with customerId', () => {
    const result = validateSaleInput({ documentType: 'TICKET', customerId: 'cust-1' })
    expect(result.valid).toBe(true)
  })
})
