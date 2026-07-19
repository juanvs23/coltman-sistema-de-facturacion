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
        receiptNumber: 1,
        status: 'COMPLETED',
        subtotal: 100,
        taxTotal: 16,
        total: 116,
        paymentMethod: input.paymentMethod,
        usdRate: input.usdRate,
        userId: input.userId,
        customerId: input.customerId ?? null,
        items: [],
        createdAt: new Date().toISOString()
      }
    }),
    listSales: async () => ({ success: false, error: 'No implementado en modo browser' }),
    cancelSale: async () => ({ success: false, error: 'No implementado en modo browser' }),
    openRegister: async () => ({ success: false, error: 'No implementado en modo browser' }),
    closeRegister: async () => ({ success: false, error: 'No implementado en modo browser' }),
    getCashSummary: async () => ({ success: false, error: 'No implementado en modo browser' }),
    getUsdRate: async () => ({ success: false, error: 'No implementado en modo browser' }),
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
