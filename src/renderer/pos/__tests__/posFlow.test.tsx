import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavigationProvider } from '../../shared/hooks/useNavigation'
import { ThemeProvider } from '../../shared/hooks/useTheme'
import PosPage from '../pages/PosPage'

vi.mock('../../shared/hooks/useAuth', () => ({
  useAuth: () => ({
    session: {
      userId: 'user-1',
      username: 'admin',
      fullName: 'Admin User',
      role: 'ADMIN',
      roleId: 'role-1',
      sessionToken: 'tok-1',
      loggedAt: new Date().toISOString()
    },
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const MOCK_SESSION = {
  userId: 'user-1',
  username: 'admin',
  fullName: 'Admin User',
  role: 'ADMIN',
  roleId: 'role-1',
  sessionToken: 'tok-1',
  loggedAt: new Date().toISOString()
}

const MOCK_PRODUCT = {
  id: 'prod-1',
  code: '1234567890',
  name: 'Coca Cola 355ml',
  type: 'PRODUCT' as const,
  price: 10,
  priceUsd: 0.50,
  stock: 100,
  active: true,
  taxes: [{ productId: 'prod-1', taxId: 'tax-1', tax: { id: 'tax-1', name: 'IVA 16%', rate: 16, active: true } }]
}

const MOCK_CUSTOMER = {
  id: 'cust-1',
  taxId: 'V-12345678-0',
  name: 'Cliente de Prueba',
  personType: 'V',
  personSubtype: 'contribuyente',
  active: true
}

function renderPosPage(): ReturnType<typeof render> {
  return render(
    <NavigationProvider>
      <ThemeProvider>
        <PosPage />
      </ThemeProvider>
    </NavigationProvider>
  )
}

/** Helper: within PaymentModal (FACTURA mode), creates a customer before paying */
async function createCustomerInModal(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByText('+ Nuevo'))
  await user.type(screen.getByPlaceholderText('12345678'), '12345678')
  await user.type(screen.getByPlaceholderText('Nombre o razón social'), 'Cliente de Prueba')
  await user.click(screen.getByText('Crear cliente'))
  await waitFor(() => {
    expect(screen.getByText('Cliente de Prueba')).toBeInTheDocument()
  })
}

describe('POS flow', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    window.electronAPI.getCountryPlugin = vi.fn().mockResolvedValue({ success: true, data: null })
    window.electronAPI.getActiveCashRegister = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'register-1', openingBalance: 1000, openedAt: new Date().toISOString(), shiftConfig: null, openedBy: null }
    })
    window.electronAPI.getUsdRate = vi.fn().mockResolvedValue({ success: true, data: { rate: 50 } })
    window.electronAPI.getNextReceiptNumber = vi.fn().mockResolvedValue({ success: true, data: 42 })
    window.electronAPI.getConfig = vi.fn().mockResolvedValue({ success: true, data: { inactivityTimeout: 600 } })
    window.electronAPI.listProducts = vi.fn().mockResolvedValue({ success: true, data: [MOCK_PRODUCT] })
    window.electronAPI.searchProducts = vi.fn().mockResolvedValue({ success: true, data: [MOCK_PRODUCT] })
    window.electronAPI.searchCustomers = vi.fn().mockResolvedValue({ success: true, data: [] })
    window.electronAPI.createCustomer = vi.fn().mockResolvedValue({ success: true, data: MOCK_CUSTOMER })
    window.electronAPI.createSale = vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'sale-1',
        receiptNumber: 42,
        documentType: 'TICKET',
        status: 'COMPLETED',
        subtotal: 0.50,
        taxTotal: 0.08,
        discount: 0,
        total: 0.58,
        usdRate: 50,
        notes: null,
        userId: 'user-1',
        customerId: null,
        customer: null,
        items: [{ id: 'item-1', quantity: 1, price: 25, priceUsd: 0.50, discount: 0, subtotal: 0.50, taxRate: 16, taxAmount: 0.08, total: 0.58, productId: 'prod-1', product: MOCK_PRODUCT }],
        payments: [{ id: 'pay-1', method: 'CASH', amountBs: 29, reference: null }],
        user: MOCK_SESSION,
        createdAt: new Date().toISOString()
      }
    })
  })

  it('renders POS page with barcode input and shortcut bar', async () => {
    renderPosPage()

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/código de barras/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/F1/i)).toBeInTheDocument()
    expect(screen.getByText(/F2/i)).toBeInTheDocument()
    expect(screen.getByText(/F4/i)).toBeInTheDocument()
  })

  it('navigates to pos view by default', async () => {
    renderPosPage()

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/código de barras/i)).toBeInTheDocument()
    })
  })

  it('searches product by barcode and shows success', async () => {
    window.electronAPI.searchProducts = vi.fn().mockResolvedValue({ success: true, data: [MOCK_PRODUCT] })
    renderPosPage()

    const input = await screen.findByPlaceholderText(/código de barras/i)
    const user = userEvent.setup()
    await user.type(input, '1234567890')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cobrar \(F4\)/i })).toBeInTheDocument()
    })
  })

  it('shows available products in search grid', async () => {
    renderPosPage()

    await waitFor(() => {
      expect(screen.getByText(/Coca Cola 355ml/i)).toBeInTheDocument()
    })
  })

  it('opens payment modal when F4 is pressed with items in cart', async () => {
    renderPosPage()

    const productCard = await screen.findByText(/Coca Cola 355ml/i)
    const user = userEvent.setup()
    await user.click(productCard)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cobrar (F4)' })).toBeInTheDocument()
    })

    await user.keyboard('{F4}')
    await waitFor(() => {
      expect(screen.getByText(/Resumen/i)).toBeInTheDocument()
    })
  })

  it('completes a full sale flow from product selection to receipt', async () => {
    renderPosPage()

    const productCard = await screen.findByText(/Coca Cola 355ml/i)
    const user = userEvent.setup()
    await user.click(productCard)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cobrar (F4)' })).toBeInTheDocument()
    })

    await user.keyboard('{F4}')

    await waitFor(() => {
      expect(screen.getByText(/Resumen/i)).toBeInTheDocument()
    })

    // FACTURA requires a customer
    await createCustomerInModal(user)

    const cashInput = screen.getByPlaceholderText(/\$\s+\d/)
    await user.clear(cashInput)
    await user.type(cashInput, '29')

    const cobrarButton = screen.getByRole('button', { name: /cobrar\s+\$/i })
    await user.click(cobrarButton)

    await waitFor(() => {
      expect(screen.getByText(/Venta completada/i)).toBeInTheDocument()
    })

    expect(window.electronAPI.createSale).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ productId: 'prod-1', quantity: 1 })
        ]),
        payments: expect.arrayContaining([
          expect.objectContaining({ method: 'CASH' })
        ])
      })
    )
  })

  it('shows error when payment total does not match', async () => {
    renderPosPage()

    const productCard = await screen.findByText(/Coca Cola 355ml/i)
    const user = userEvent.setup()
    await user.click(productCard)

    await waitFor(() => screen.getByRole('button', { name: 'Cobrar (F4)' }))
    await user.keyboard('{F4}')

    await waitFor(() => screen.getByText(/Resumen/i))

    // FACTURA requires a customer
    await createCustomerInModal(user)

    const cashInput = screen.getByPlaceholderText(/\$\s+\d/)
    await user.clear(cashInput)
    await user.type(cashInput, '1')

    const cobrarButton = screen.getByRole('button', { name: /cobrar\s+\$/i })
    await user.click(cobrarButton)

    await waitFor(() => {
      expect(screen.getByText(/Los pagos deben sumar/i)).toBeInTheDocument()
    })
  })

  it('shows receipt confirm after successful sale and allows new sale', async () => {
    renderPosPage()

    const productCard = await screen.findByText(/Coca Cola 355ml/i)
    const user = userEvent.setup()
    await user.click(productCard)
    await waitFor(() => screen.getByRole('button', { name: 'Cobrar (F4)' }))
    await user.keyboard('{F4}')
    await waitFor(() => screen.getByText(/Resumen/i))

    // FACTURA requires a customer
    await createCustomerInModal(user)

    const cashInput = screen.getByPlaceholderText(/\$\s+\d/)
    await user.clear(cashInput)
    await user.type(cashInput, '29')

    await user.click(screen.getByRole('button', { name: /cobrar\s+\$/i }))

    await waitFor(() => {
      expect(screen.getByText(/Venta completada/i)).toBeInTheDocument()
    })

    const newSaleButton = screen.getByRole('button', { name: /nueva venta/i })
    await user.click(newSaleButton)

    await waitFor(() => {
      expect(screen.queryByText(/Venta completada/i)).not.toBeInTheDocument()
    })
  })

  it('handles IPC errors during sale creation gracefully', async () => {
    window.electronAPI.createSale = vi.fn().mockResolvedValue({ success: false, error: 'Stock insuficiente' })
    renderPosPage()

    const productCard = await screen.findByText(/Coca Cola 355ml/i)
    const user = userEvent.setup()
    await user.click(productCard)
    await waitFor(() => screen.getByRole('button', { name: 'Cobrar (F4)' }))
    await user.keyboard('{F4}')
    await waitFor(() => screen.getByText(/Resumen/i))

    // FACTURA requires a customer
    await createCustomerInModal(user)

    const cashInput = screen.getByPlaceholderText(/\$\s+\d/)
    await user.clear(cashInput)
    await user.type(cashInput, '29')

    await user.click(screen.getByRole('button', { name: /cobrar\s+\$/i }))

    await waitFor(() => {
      expect(screen.getByText(/Stock insuficiente/i)).toBeInTheDocument()
    })
  })
})
