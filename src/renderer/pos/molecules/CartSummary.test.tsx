import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CartSummary from './CartSummary'
import type { Product } from '@shared/types'

const PRODUCT: Product = {
  id: '1', code: 'P001', name: 'Producto A', type: 'PRODUCT',
  price: 0, priceUsd: 10, stock: 50, taxes: [], active: true
}

const PRODUCT_WITH_TAX: Product = {
  id: '2', code: 'P002', name: 'Producto B', type: 'PRODUCT',
  price: 0, priceUsd: 100, stock: 50,
  taxes: [{ productId: '2', taxId: '1', tax: { id: '1', name: 'IVA 16%', rate: 16, active: true } }],
  active: true
}

describe('CartSummary', () => {
  it('shows subtotal, tax and total for empty cart', () => {
    render(<CartSummary entries={[]} usdRate={50} />)
    const amounts = screen.getAllByText('$0.00')
    expect(amounts.length).toBeGreaterThanOrEqual(1)
  })

  it('calculates totals correctly without taxes', () => {
    render(<CartSummary entries={[{ product: PRODUCT, quantity: 2, discount: 0 }]} usdRate={50} />)
    const subtotals = screen.getAllByText('$20.00')
    expect(subtotals.length).toBeGreaterThanOrEqual(1) // subtotal and total
  })

  it('calculates taxes correctly', () => {
    render(<CartSummary entries={[{ product: PRODUCT_WITH_TAX, quantity: 1, discount: 0 }]} usdRate={50} />)
    expect(screen.getByText('$100.00')).toBeInTheDocument() // subtotal
    expect(screen.getByText('$16.00')).toBeInTheDocument()  // tax (16%)
  })
})
