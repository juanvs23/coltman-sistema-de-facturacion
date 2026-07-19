import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Dev mock: permite probar UI desde navegador sin Electron
if (!window.electronAPI) {
  // Plugin states persistentes (localStorage para sobrevivir reloads)
  const readPluginState = (id: string, defaultActive = false): boolean => {
    try {
      const stored = localStorage.getItem(`plugin-state-${id}`)
      return stored !== null ? stored !== 'false' : defaultActive
    } catch { return defaultActive }
  }
  const writePluginState = (id: string, active: boolean): void => {
    try { localStorage.setItem(`plugin-state-${id}`, String(active)) }
    catch { /* noop */ }
  }

  window.electronAPI = {
    login: async (credentials) => {
      // Mock para desarrollo: acepta admin/admin123
      await new Promise((r) => setTimeout(r, 500))
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        return {
          success: true,
          data: {
            userId: 'mock-id',
            username: 'admin',
            fullName: 'Administrador Principal',
            role: 'SUPERADMIN',
            loggedAt: new Date().toISOString()
          }
        }
      }
      return { success: false, error: 'Usuario o contraseña incorrectos' }
    },
    logout: async () => ({ success: true }),
    getSession: async () => ({ success: false, data: null }),
    listProducts: async () => ({
      success: true,
      data: [
        { id: '1', code: 'P001', name: 'Producto de prueba', type: 'PRODUCT', price: 12.13, priceUsd: 0.25, stock: 100, active: true, category: { id: '1', name: 'General' }, taxes: [] },
        { id: '2', code: 'P002', name: 'Servicio de prueba', type: 'SERVICE', price: 0, priceUsd: 10, stock: 0, active: true, category: { id: '1', name: 'General' }, taxes: [] }
      ]
    }),
    searchProducts: async (query) => ({
      success: true,
      data: [
        { id: '1', code: 'P001', name: `Resultado para: ${query}`, type: 'PRODUCT', price: 12.13, priceUsd: 0.25, stock: 100, taxRate: 16, active: true, category: null, taxes: [] }
      ]
    }),
    createProduct: async (input) => ({
      success: true,
      data: { id: crypto.randomUUID(), price: 0, ...(input as object), category: null, taxes: [] }
    }),
    updateProduct: async (id, input) => ({
      success: true,
      data: { id, price: 0, ...(input as object), category: null, taxes: [] }
    }),
    deleteProduct: async () => ({ success: true }),
    listCategories: async () => ({
      success: true,
      data: [
        { id: '1', name: 'General', color: '#3b82f6' },
        { id: '2', name: 'Alimentos', color: '#22c55e' }
      ]
    }),
    createCategory: async (name, color) => ({
      success: true,
      data: { id: crypto.randomUUID(), name, color }
    }),
    updateCategory: async (id, name, color) => ({
      success: true,
      data: { id, name, color }
    }),
    deleteCategory: async () => ({ success: true }),
    listTaxes: async () => ({
      success: true,
      data: [
        { id: '1', name: 'IVA General 16%', rate: 16.0, active: true },
        { id: '2', name: 'Exento', rate: 0.0, active: true }
      ]
    }),
    createTax: async (input) => ({
      success: true,
      data: { id: crypto.randomUUID(), ...input, active: true }
    }),
    updateTax: async (id, input) => ({
      success: true,
      data: { id, name: 'IVA 16%', rate: 16.0, ...input }
    }),
    createSale: async (input) => ({
      success: true,
      data: {
        id: crypto.randomUUID(),
        receiptNumber: Math.floor(Math.random() * 9000) + 1000,
        documentType: input.documentType ?? 'TICKET',
        status: 'COMPLETED',
        subtotal: 100,
        taxTotal: 16,
        discount: 0,
        total: 116,
        paymentMethod: input.paymentMethod ?? 'CASH',
        usdRate: input.usdRate ?? 48.5,
        notes: input.notes ?? null,
        userId: input.userId ?? 'mock-id',
        customerId: input.customerId ?? null,
        customer: input.customerId ? { id: '1', taxId: 'J-12345678-4', name: 'Mi Negocio C.A.', active: true } : null,
        items: [],
        createdAt: new Date().toISOString()
      }
    }),
    listSales: async () => ({
      success: true,
      data: [
        {
          id: 's1', receiptNumber: 1001, documentType: 'FACTURA', status: 'COMPLETED',
          subtotal: 80, taxTotal: 12.8, discount: 0, total: 92.8,
          paymentMethod: 'CASH', usdRate: 48.5, notes: null,
          userId: '1', user: { id: '1', fullName: 'Administrador Principal' },
          customerId: '1', customer: { id: '1', taxId: 'J-12345678-4', name: 'Mi Negocio C.A.' },
          items: [{ id: 'i1', quantity: 2, price: 46.4, priceUsd: 0.25, discount: 0, subtotal: 92.8, taxRate: 16, taxAmount: 12.8, total: 105.6, productId: '1', product: { id: '1', name: 'Producto de prueba' } }],
          createdAt: new Date().toISOString()
        },
        {
          id: 's2', receiptNumber: 1002, documentType: 'TICKET', status: 'COMPLETED',
          subtotal: 50, taxTotal: 8, discount: 5, total: 53,
          paymentMethod: 'TRANSFER', usdRate: 48.5, notes: 'Pago móvil',
          userId: '2', user: { id: '2', fullName: 'Vendedor Uno' },
          customerId: null, customer: null,
          items: [{ id: 'i2', quantity: 5, price: 10.6, priceUsd: 0.25, discount: 0, subtotal: 53, taxRate: 16, taxAmount: 8, total: 61, productId: '1', product: { id: '1', name: 'Producto de prueba' } }],
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 's3', receiptNumber: 1003, documentType: 'FACTURA', status: 'CANCELLED',
          subtotal: 200, taxTotal: 32, discount: 10, total: 222,
          paymentMethod: 'DIVISA', usdRate: 49, notes: 'Anulación: Error en monto',
          userId: '1', user: { id: '1', fullName: 'Administrador Principal' },
          customerId: '1', customer: { id: '1', taxId: 'J-12345678-4', name: 'Mi Negocio C.A.' },
          items: [],
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          cancelledAt: new Date().toISOString()
        }
      ]
    }),
    cancelSale: async () => ({ success: true, data: { status: 'CANCELLED' } }),
    getNextReceiptNumber: async () => ({ success: true, data: 1004 }),
    openRegister: async () => ({ success: true, data: { id: 'reg-1', openingBalance: 200 } }),
    closeRegister: async () => ({ success: true }),
    getCashSummary: async () => ({
      success: true,
      data: {
        register: {
          id: 'reg-1', openingBalance: 200, closingBalance: null, date: new Date().toISOString(), createdAt: new Date().toISOString(),
          movements: [
            { id: 'm1', type: 'OPENING', amount: 200, description: 'Apertura de caja', createdAt: new Date().toISOString(), user: { fullName: 'Administrador Principal' } },
            { id: 'm2', type: 'INCOME', amount: 50, description: 'Ingreso extra', createdAt: new Date().toISOString(), user: { fullName: 'Administrador Principal' } }
          ]
        },
        sales: [
          { paymentMethod: 'CASH', total: 92.8 },
          { paymentMethod: 'TRANSFER', total: 53 },
          { paymentMethod: 'CASH', total: 120 }
        ]
      }
    }),
    addCashMovement: async () => ({ success: true }),
    getDailyReport: async () => ({
      success: true,
      data: { date: new Date().toISOString(), sales: 8, total: 525.5, byMethod: { CASH: 212.8, TRANSFER: 153, DIVISA: 120, count: 8 } }
    }),
    getProductReport: async () => ({
      success: true,
      data: [
        { name: 'Producto de prueba', quantity: 25, total: 162.5 },
        { name: 'Servicio de prueba', quantity: 10, total: 100 },
        { name: 'Café', quantity: 50, total: 75 }
      ]
    }),
    getUserReport: async () => ({
      success: true,
      data: [
        { name: 'Administrador Principal', sales: 12, total: 380 },
        { name: 'Vendedor Uno', sales: 5, total: 145.5 }
      ]
    }),
    getIvaReport: async () => ({
      success: true,
      data: {
        period: '2026-07',
        entries: [
          { date: new Date().toISOString(), receiptNumber: 1001, customerName: 'Mi Negocio C.A.', customerTaxId: 'J-12345678-4', subtotal: 80, taxTotal: 12.8, total: 92.8, discount: 0 },
          { date: new Date().toISOString(), receiptNumber: 1004, customerName: 'Juan Pérez', customerTaxId: 'V-87654321-1', subtotal: 45, taxTotal: 7.2, total: 52.2, discount: 0 }
        ],
        totals: { subtotal: 125, taxTotal: 20, total: 145, discount: 0 }
      }
    }),
    getCompanyConfig: async () => ({
      success: true,
      data: { businessName: 'Mi Negocio C.A.', taxId: 'J-12345678-9', address: 'Av. Principal, Caracas', phone: '+58 212 1234567', email: 'contacto@minegocio.com', logo: '' }
    }),
    updateCompanyConfig: async () => ({ success: true, data: { businessName: 'Mi Negocio C.A.' } }),
    getUsdRate: async () => ({ success: true, data: { rate: 48.50, source: 'bcv' } }),
    getConfig: async () => ({ success: false, error: 'No implementado en modo browser' }),
    updateConfig: async () => ({ success: false, error: 'No implementado en modo browser' }),
    testPrinter: async () => ({ success: false, error: 'No implementado en modo browser' }),
    printReceipt: async () => ({ success: false, error: 'No implementado en modo browser' }),
    // Users
    listUsers: async () => ({
      success: true,
      data: [
        { id: '1', username: 'admin', fullName: 'Administrador Principal', role: 'SUPERADMIN' as const, active: true },
        { id: '2', username: 'vendedor1', fullName: 'Vendedor Uno', role: 'SELLER' as const, active: true },
        { id: '3', username: 'vendedor2', fullName: 'Vendedor Dos', role: 'SELLER' as const, active: false }
      ]
    }),
    createUser: async (input) => ({
      success: true,
      data: { id: crypto.randomUUID(), ...input, active: true }
    }),
    updateUser: async (_id, input) => ({
      success: true,
      data: { id: '1', username: 'admin', fullName: input.fullName ?? 'Administrador Principal', role: input.role ?? 'SUPERADMIN' as const, active: true }
    }),
    toggleUserActive: async (id) => ({
      success: true,
      data: { id, username: 'mock', fullName: 'Mock User', role: 'SELLER' as const, active: true }
    }),
    // Customers
    listCustomers: async () => ({
      success: true,
      data: [
        { id: '1', taxId: 'J-12345678-4', name: 'Mi Negocio C.A.', address: 'Av. Principal, Caracas', phone: '0212-5555555', active: true },
        { id: '2', taxId: 'V-87654321-1', name: 'Juan Pérez', phone: '0414-1234567', active: true }
      ]
    }),
    searchCustomers: async (query) => ({
      success: true,
      data: [
        { id: '1', taxId: 'J-12345678-4', name: `Resultado: ${query}`, active: true }
      ]
    }),
    findCustomerByTaxId: async () => ({ success: true, data: null }),
    createCustomer: async (input) => ({ success: true, data: { id: crypto.randomUUID(), ...input, active: true } }),
    updateCustomer: async (id, input) => ({ success: true, data: { id, taxId: 'J-12345678-4', name: 'Editado', ...input, active: true } }),
    deleteCustomer: async () => ({ success: true }),
    listPlugins: async () => ({
      success: true,
      data: [
        { id: 'plugin-ve', name: 'Venezuela 🇻🇪', version: '1.0.0', description: 'RIF, IVA, Bs., SENIAT', enabled: readPluginState('plugin-ve', true) },
        { id: 'plugin-co', name: 'Colombia 🇨🇴', version: '0.1.0', description: 'NIT, IVA 19%, DIAN', enabled: readPluginState('plugin-co') }
      ]
    }),
    installPlugin: async () => ({ success: false, error: 'No implementado en modo browser' }),
    togglePluginActive: async (id) => {
      const current = readPluginState(id)
      writePluginState(id, !current)
      return { success: true, data: { active: !current } }
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
