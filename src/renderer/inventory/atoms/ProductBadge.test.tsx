import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductBadge from './ProductBadge'

describe('ProductBadge', () => {
  it('shows "Sin stock" for PRODUCT with 0 stock', () => {
    render(<ProductBadge stock={0} type="PRODUCT" />)
    expect(screen.getByText('Sin stock')).toBeInTheDocument()
  })

  it('shows stock count for low stock product', () => {
    render(<ProductBadge stock={5} type="PRODUCT" lowStockThreshold={10} />)
    expect(screen.getByText('5 uds.')).toBeInTheDocument()
  })

  it('shows stock count for normal stock', () => {
    render(<ProductBadge stock={50} type="PRODUCT" />)
    expect(screen.getByText('50 uds.')).toBeInTheDocument()
  })

  it('shows "Servicio" for SERVICE type', () => {
    render(<ProductBadge stock={0} type="SERVICE" />)
    expect(screen.getByText('Servicio')).toBeInTheDocument()
  })

  it('shows "Combo" for COMBO type', () => {
    render(<ProductBadge stock={0} type="COMBO" />)
    expect(screen.getByText('Combo')).toBeInTheDocument()
  })
})
