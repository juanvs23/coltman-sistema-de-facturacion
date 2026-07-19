import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductRow from './ProductRow'
import type { Product } from '@shared/types'

const MOCK_PRODUCT: Product = {
  id: '1',
  code: 'P001',
  name: 'Producto de prueba',
  description: 'Descripción del producto',
  type: 'PRODUCT',
  price: 25.50,
  priceUsd: 0.53,
  stock: 100,
  category: { id: '1', name: 'General', color: '#3b82f6' },
  categoryId: '1',
  taxes: []
}

describe('ProductRow', () => {
  it('renders product information', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(<ProductRow product={MOCK_PRODUCT} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.getByText('P001')).toBeInTheDocument()
    expect(screen.getByText('Producto de prueba')).toBeInTheDocument()
    expect(screen.getByText('Bs. 25.50')).toBeInTheDocument()
    expect(screen.getByText('$0.53')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  it('calls onEdit when clicking Editar', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(<ProductRow product={MOCK_PRODUCT} onEdit={onEdit} onDelete={onDelete} />)

    await user.click(screen.getByText('Editar'))
    expect(onEdit).toHaveBeenCalledWith(MOCK_PRODUCT)
  })

  it('calls onDelete when clicking Eliminar', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(<ProductRow product={MOCK_PRODUCT} onEdit={onEdit} onDelete={onDelete} />)

    await user.click(screen.getByText('Eliminar'))
    expect(onDelete).toHaveBeenCalledWith(MOCK_PRODUCT)
  })
})
