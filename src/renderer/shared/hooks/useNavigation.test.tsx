import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavigationProvider, useNavigation, NAV_ITEMS } from './useNavigation'

function TestConsumer(): JSX.Element {
  const { activeView, navigate } = useNavigation()
  return (
    <div>
      <p data-testid="active-view">{activeView}</p>
      {NAV_ITEMS.map((item) => (
        <button key={item.id} onClick={() => navigate(item.id)} data-testid={`nav-${item.id}`}>
          {item.label}
        </button>
      ))}
    </div>
  )
}

function renderWithProvider(): ReturnType<typeof render> {
  return render(
    <NavigationProvider>
      <TestConsumer />
    </NavigationProvider>
  )
}

describe('NavigationContext', () => {
  it('starts with pos as the default active view', () => {
    renderWithProvider()
    expect(screen.getByTestId('active-view')).toHaveTextContent('pos')
  })

  it('navigates to inventory', async () => {
    const user = userEvent.setup()
    renderWithProvider()
    await user.click(screen.getByTestId('nav-inventory'))
    expect(screen.getByTestId('active-view')).toHaveTextContent('inventory')
  })

  it('navigates to invoices', async () => {
    const user = userEvent.setup()
    renderWithProvider()
    await user.click(screen.getByTestId('nav-invoices'))
    expect(screen.getByTestId('active-view')).toHaveTextContent('invoices')
  })

  it('navigates to cash', async () => {
    const user = userEvent.setup()
    renderWithProvider()
    await user.click(screen.getByTestId('nav-cash'))
    expect(screen.getByTestId('active-view')).toHaveTextContent('cash')
  })

  it('navigates to reports', async () => {
    const user = userEvent.setup()
    renderWithProvider()
    await user.click(screen.getByTestId('nav-reports'))
    expect(screen.getByTestId('active-view')).toHaveTextContent('reports')
  })

  it('navigates to settings', async () => {
    const user = userEvent.setup()
    renderWithProvider()
    await user.click(screen.getByTestId('nav-settings'))
    expect(screen.getByTestId('active-view')).toHaveTextContent('settings')
  })

  it('navigates back to pos from another view', async () => {
    const user = userEvent.setup()
    renderWithProvider()
    await user.click(screen.getByTestId('nav-settings'))
    expect(screen.getByTestId('active-view')).toHaveTextContent('settings')
    await user.click(screen.getByTestId('nav-pos'))
    expect(screen.getByTestId('active-view')).toHaveTextContent('pos')
  })

  it('useNavigation throws outside NavigationProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow(
      'useNavigation must be used within a NavigationProvider'
    )
    spy.mockRestore()
  })
})
