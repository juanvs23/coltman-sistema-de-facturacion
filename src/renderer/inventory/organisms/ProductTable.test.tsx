import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductTable from './ProductTable'
import type { Product } from '@shared/types'

const MOCK_PRODUCTS: Product[] = [
  { id: '1', code: 'P001', name: 'Arroz', type: 'PRODUCT', price: 121.25, priceUsd: 2.50, stock: 100, category: { id: '1', name: 'Alimentos' }, categoryId: '1', taxes: [] },
  { id: '2', code: 'P002', name: 'Harina', type: 'PRODUCT', price: 72.75, priceUsd: 1.50, stock: 5, category: { id: '1', name: 'Alimentos' }, categoryId: '1', taxes: [] },
  { id: '3', code: 'S001', name: 'Servicio de entrega', type: 'SERVICE', price: 485, priceUsd: 10, stock: 0, category: null, categoryId: null, taxes: [] }
]

beforeEach(() => {
  window.electronAPI.listProducts = vi.fn().mockResolvedValue({ success: true, data: MOCK_PRODUCTS })
  window.electronAPI.deleteProduct = vi.fn().mockResolvedValue({ success: true })
  window.confirm = vi.fn().mockReturnValue(true)
})

describe('ProductTable', () => {
  it('loads and displays products', async () => {
    render(<ProductTable onEdit={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Arroz')).toBeInTheDocument()
    })

    expect(screen.getByText('Harina')).toBeInTheDocument()
    expect(screen.getByText('Servicio de entrega')).toBeInTheDocument()
    expect(screen.getByText('3 de 3 productos')).toBeInTheDocument()
  })

  it('filters products by search', async () => {
    const user = userEvent.setup()
    render(<ProductTable onEdit={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Arroz')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Buscar por código o nombre...')
    await user.type(searchInput, 'Arroz')

    expect(screen.getByText('Arroz')).toBeInTheDocument()
    expect(screen.queryByText('Harina')).not.toBeInTheDocument()
    expect(screen.getByText('1 de 3 productos')).toBeInTheDocument()
  })

  it('calls onEdit when clicking Editar', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<ProductTable onEdit={onEdit} />)

    await waitFor(() => {
      expect(screen.getByText('Arroz')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByText('Editar')
    await user.click(editButtons[0])

    expect(onEdit).toHaveBeenCalledWith(MOCK_PRODUCTS[0])
  })

  it('calls deleteProduct when confirming delete', async () => {
    const user = userEvent.setup()
    render(<ProductTable onEdit={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Arroz')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByText('Eliminar')
    await user.click(deleteButtons[0])

    expect(window.confirm).toHaveBeenCalled()
    expect(window.electronAPI.deleteProduct).toHaveBeenCalledWith('1')
  })
})
