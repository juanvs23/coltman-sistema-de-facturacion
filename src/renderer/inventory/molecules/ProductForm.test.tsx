import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductForm from './ProductForm'
import type { Product, Category, Tax } from '@shared/types'

const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'General', color: '#3b82f6' },
  { id: '2', name: 'Alimentos', color: '#22c55e' }
]

const MOCK_TAXES: Tax[] = [
  { id: '1', name: 'IVA General 16%', rate: 16.0, active: true },
  { id: '2', name: 'Exento', rate: 0.0, active: true }
]

const MOCK_PRODUCT: Product = {
  id: '1',
  code: 'P001',
  name: 'Producto existente',
  type: 'PRODUCT',
  price: 100,
  priceUsd: 2.06,
  stock: 50,
  category: MOCK_CATEGORIES[0],
  categoryId: '1',
  taxes: []
}

describe('ProductForm', () => {
  it('renders create form with empty fields', () => {
    render(<ProductForm product={null} categories={MOCK_CATEGORIES} taxes={MOCK_TAXES} onSave={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByLabelText('Código / SKU')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
    expect(screen.getByLabelText(/Precio USD/)).toBeInTheDocument()
    expect(screen.getByText('Crear producto')).toBeInTheDocument()
  })

  it('renders edit form with product data', () => {
    render(<ProductForm product={MOCK_PRODUCT} categories={MOCK_CATEGORIES} taxes={MOCK_TAXES} onSave={vi.fn()} onCancel={vi.fn()} />)

    const codeInput = screen.getByLabelText('Código / SKU') as HTMLInputElement
    expect(codeInput.value).toBe('P001')
    expect(codeInput.disabled).toBe(true)

    const nameInput = screen.getByLabelText('Nombre') as HTMLInputElement
    expect(nameInput.value).toBe('Producto existente')
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<ProductForm product={null} categories={MOCK_CATEGORIES} taxes={MOCK_TAXES} onSave={onSave} onCancel={vi.fn()} />)

    await user.click(screen.getByText('Crear producto'))
    expect(screen.getByText('El código es obligatorio')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('calls onSave with form data', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<ProductForm product={null} categories={MOCK_CATEGORIES} taxes={MOCK_TAXES} onSave={onSave} onCancel={vi.fn()} />)

    await user.type(screen.getByLabelText('Código / SKU'), 'P002')
    await user.type(screen.getByLabelText('Nombre'), 'Nuevo producto')
    await user.type(screen.getByLabelText(/Precio USD/), '1.50')
    await user.type(screen.getByLabelText('Stock'), '10')

    await user.click(screen.getByText('Crear producto'))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      code: 'P002',
      name: 'Nuevo producto',
      priceUsd: 1.50,
      stock: 10,
      type: 'PRODUCT'
    }))
  })
})
