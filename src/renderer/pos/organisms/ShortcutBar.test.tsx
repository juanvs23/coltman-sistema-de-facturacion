import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ShortcutBar from './ShortcutBar'

describe('ShortcutBar', () => {
  it('renders all 8 shortcut buttons', () => {
    render(<ShortcutBar onShortcut={vi.fn()} />)
    expect(screen.getByText('Ayuda')).toBeInTheDocument()
    expect(screen.getByText('Buscar')).toBeInTheDocument()
    expect(screen.getByText('Cobrar')).toBeInTheDocument()
    expect(screen.getByText('Descuento')).toBeInTheDocument()
    expect(screen.getByText('Anular')).toBeInTheDocument()
    expect(screen.getByText('Retener')).toBeInTheDocument()
    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.getByText('Nota')).toBeInTheDocument()
  })

  it('enables F2 and F4 buttons', () => {
    render(<ShortcutBar onShortcut={vi.fn()} />)
    expect(screen.getByRole('button', { name: /buscar/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /cobrar/i })).not.toBeDisabled()
  })

  it('disables F5-F9 with Próximamente tooltip', () => {
    render(<ShortcutBar onShortcut={vi.fn()} />)
    const descuento = screen.getByRole('button', { name: /descuento/i })
    expect(descuento).toBeDisabled()
    expect(descuento).toHaveAttribute('title', 'Próximamente')
    expect(screen.getByRole('button', { name: /anular/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cliente/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /nota/i })).toBeDisabled()
  })

  it('calls onShortcut with F2 when Buscar is clicked', () => {
    const onShortcut = vi.fn()
    render(<ShortcutBar onShortcut={onShortcut} />)
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }))
    expect(onShortcut).toHaveBeenCalledWith('F2')
  })

  it('calls onShortcut with F4 when Cobrar is clicked', () => {
    const onShortcut = vi.fn()
    render(<ShortcutBar onShortcut={onShortcut} />)
    fireEvent.click(screen.getByRole('button', { name: /cobrar/i }))
    expect(onShortcut).toHaveBeenCalledWith('F4')
  })

  it('does not call onShortcut when disabled button is clicked', () => {
    const onShortcut = vi.fn()
    render(<ShortcutBar onShortcut={onShortcut} />)
    fireEvent.click(screen.getByRole('button', { name: /descuento/i }))
    expect(onShortcut).not.toHaveBeenCalled()
  })
})
