import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuantityInput from './QuantityInput'

describe('QuantityInput', () => {
  it('renders with initial value', () => {
    render(<QuantityInput value={5} onChange={vi.fn()} />)
    const input = screen.getByRole('spinbutton') as HTMLInputElement
    expect(input.value).toBe('5')
  })

  it('calls onChange when clicking +', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<QuantityInput value={5} onChange={onChange} />)
    await user.click(screen.getByText('+'))
    expect(onChange).toHaveBeenCalledWith(6)
  })

  it('calls onChange when clicking −', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<QuantityInput value={5} onChange={onChange} />)
    await user.click(screen.getByText('−'))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('disables − at min value', () => {
    render(<QuantityInput value={1} onChange={vi.fn()} min={1} />)
    expect(screen.getByText('−')).toBeDisabled()
  })
})
