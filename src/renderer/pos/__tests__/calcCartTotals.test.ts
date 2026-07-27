import { describe, it, expect } from 'vitest'
import { calcCartTotals } from '../molecules/calcCartTotals'
import type { CartEntry } from '../organisms/ShoppingCart'

function entry(overrides: { product?: Partial<CartEntry['product']>; quantity?: number; discount?: number } = {}): CartEntry {
  return {
    product: {
      id: 'p1',
      code: '001',
      name: 'Test Product',
      type: 'PRODUCT',
      price: 0,
      priceUsd: 10,
      stock: 100,
      active: true,
      taxes: [],
      ...overrides.product
    },
    quantity: overrides.quantity ?? 1,
    discount: overrides.discount ?? 0,
  }
}

describe('calcCartTotals', () => {
  it('returns zero totals for empty cart', () => {
    const result = calcCartTotals([])
    expect(result).toEqual({ subtotalUsd: 0, taxTotalUsd: 0, discountTotalUsd: 0, totalUsd: 0 })
  })

  it('calculates total for single product with no tax', () => {
    const result = calcCartTotals([entry()])
    expect(result.subtotalUsd).toBe(10)
    expect(result.taxTotalUsd).toBe(0)
    expect(result.totalUsd).toBe(10)
  })

  it('calculates tax at correct rate', () => {
    const cart = [entry({
      product: { taxes: [{ productId: 'p1', taxId: 't1', tax: { id: 't1', name: 'IVA 16%', rate: 16, active: true } }] }
    })]
    const result = calcCartTotals(cart)
    expect(result.subtotalUsd).toBe(10)
    expect(result.taxTotalUsd).toBe(1.6)
    expect(result.totalUsd).toBe(11.6)
  })

  it('applies per-line discount before tax', () => {
    const cart = [entry({
      product: { taxes: [{ productId: 'p1', taxId: 't1', tax: { id: 't1', name: 'IVA 16%', rate: 16, active: true } }] },
      quantity: 2,
      discount: 5
    })]
    const result = calcCartTotals(cart)
    expect(result.subtotalUsd).toBe(15)
    expect(result.discountTotalUsd).toBe(5)
    expect(result.taxTotalUsd).toBe(2.4)
    expect(result.totalUsd).toBe(17.4)
  })

  it('applies global discount after tax', () => {
    const cart = [entry({
      product: { taxes: [{ productId: 'p1', taxId: 't1', tax: { id: 't1', name: 'IVA 16%', rate: 16, active: true } }] }
    })]
    const result = calcCartTotals(cart, 2)
    expect(result.subtotalUsd).toBe(10)
    expect(result.taxTotalUsd).toBe(1.6)
    expect(result.totalUsd).toBe(9.6)
  })

  it('handles multiple products with different taxes', () => {
    const cart = [
      entry({ product: { id: 'p1', priceUsd: 20, taxes: [{ productId: 'p1', taxId: 't1', tax: { id: 't1', name: 'IVA 16%', rate: 16, active: true } }] } }),
      entry({ product: { id: 'p2', priceUsd: 5, taxes: [{ productId: 'p2', taxId: 't2', tax: { id: 't2', name: 'IVA Reducido 8%', rate: 8, active: true } }] }, quantity: 3 })
    ]
    const result = calcCartTotals(cart)
    expect(result.subtotalUsd).toBe(35)
    expect(result.discountTotalUsd).toBe(0)
    expect(result.taxTotalUsd).toBe(4.4)
    expect(result.totalUsd).toBe(39.4)
  })

  it('handles products with no tax array', () => {
    const noTaxes = entry()
    noTaxes.product.taxes = undefined
    const result = calcCartTotals([noTaxes])
    expect(result.subtotalUsd).toBe(10)
    expect(result.taxTotalUsd).toBe(0)
    expect(result.totalUsd).toBe(10)
  })

  it('handles discount only (zero tax)', () => {
    const cart = [entry({ quantity: 5, discount: 3 })]
    const result = calcCartTotals(cart, 2)
    expect(result.subtotalUsd).toBe(47)
    expect(result.discountTotalUsd).toBe(3)
    expect(result.taxTotalUsd).toBe(0)
    expect(result.totalUsd).toBe(45)
  })

  it('rounds correctly to avoid floating point issues', () => {
    const cart = [entry({
      product: { priceUsd: 9.99, taxes: [{ productId: 'p1', taxId: 't1', tax: { id: 't1', name: 'IVA 16%', rate: 16, active: true } }] }
    })]
    const result = calcCartTotals(cart)
    expect(result.subtotalUsd).toBe(9.99)
    expect(result.taxTotalUsd).toBeCloseTo(1.5984, 4)
    expect(result.totalUsd).toBeCloseTo(11.5884, 4)
  })
})
