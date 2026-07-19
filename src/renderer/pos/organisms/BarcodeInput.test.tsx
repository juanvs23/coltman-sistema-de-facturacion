import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BarcodeInput from './BarcodeInput'

beforeEach(() => {
  vi.restoreAllMocks()
  window.electronAPI.searchProducts = vi.fn().mockResolvedValue({
    success: true,
    data: [{ id: '1', code: 'P001', name: 'Test Product', priceUsd: 10, type: 'PRODUCT', stock: 50, active: true, price: 0 }]
  })
})

describe('BarcodeInput', () => {
  it('renders a text input with barcode placeholder', () => {
    render(<BarcodeInput onProductSelect={vi.fn()} disabled={false} />)
    expect(screen.getByPlaceholderText(/código de barras/i)).toBeInTheDocument()
  })

  it('calls onProductSelect on Enter with valid code', async () => {
    const onSelect = vi.fn()
    render(<BarcodeInput onProductSelect={onSelect} disabled={false} />)
    const input = screen.getByPlaceholderText(/código de barras/i)

    fireEvent.change(input, { target: { value: 'P001' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Product' }))
    })
  })

  it('shows error feedback for unknown product', async () => {
    window.electronAPI.searchProducts = vi.fn().mockResolvedValue({ success: true, data: [] })
    render(<BarcodeInput onProductSelect={vi.fn()} disabled={false} />)
    const input = screen.getByPlaceholderText(/código de barras/i)

    fireEvent.change(input, { target: { value: 'BAD' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('Producto no encontrado')).toBeInTheDocument()
    })
  })

  it('disables input when disabled prop is true', () => {
    render(<BarcodeInput onProductSelect={vi.fn()} disabled={true} />)
    expect(screen.getByPlaceholderText(/código de barras/i)).toBeDisabled()
  })

  it('clears input after successful product add', async () => {
    const onSelect = vi.fn()
    render(<BarcodeInput onProductSelect={onSelect} disabled={false} />)
    const input = screen.getByPlaceholderText(/código de barras/i)

    fireEvent.change(input, { target: { value: 'P001' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })
})
