import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Dev mock: permite probar UI desde navegador sin Electron
// Estado mutable para los mocks de caja
let mockActiveRegister: { id: string; openingBalance: number; openedAt: string; shiftConfig: null; openedBy: { fullName: string } } | null = {
  id: 'reg-mock', openingBalance: 200, openedAt: new Date().toISOString(), shiftConfig: null, openedBy: { fullName: 'Administrador Principal' }
}
const mockMovements: Array<{ id: string; type: string; amount: number; description: string; createdAt: string; user: { fullName: string } }> = [
  { id: 'm1', type: 'OPENING', amount: 200, description: 'Apertura de caja', createdAt: new Date().toISOString(), user: { fullName: 'Administrador Principal' } }
]

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
      await new Promise((r) => setTimeout(r, 300))
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        return {
          success: true,
          data: {
            userId: 'mock-admin',
            username: 'admin',
            fullName: 'Administrador Principal',
            role: 'superadmin',
            roleId: 'role-superadmin',
            sessionToken: 'mock-token-admin',
            loggedAt: new Date().toISOString()
          }
        }
      }
      if (credentials.username === 'vendedor1' && credentials.password === 'admin123') {
        return {
          success: true,
          data: {
            userId: 'mock-seller',
            username: 'vendedor1',
            fullName: 'Vendedor Uno',
            role: 'seller',
            roleId: 'role-seller',
            sessionToken: 'mock-token-seller',
            loggedAt: new Date().toISOString()
          }
        }
      }
      return { success: false, error: 'Usuario o contraseña incorrectos' }
    },
    logout: async () => ({ success: true }),
    getSession: async () => ({ success: false, data: null }),
    unlock: async (password) => {
      await new Promise((r) => setTimeout(r, 200))
      if (password === 'admin123') {
        return { success: true, data: { userId: 'mock-admin', username: 'admin', fullName: 'Administrador Principal', role: 'superadmin', roleId: 'role-superadmin', sessionToken: 'mock-token', loggedAt: new Date().toISOString() } }
      }
      return { success: false, error: 'Contrasena incorrecta' }
    },
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
        payments: input.payments ?? [{ method: 'CASH', amountBs: 116 }],
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
          payments: [{ id: 'p1', method: 'CASH', amountBs: 92.8 }], usdRate: 48.5, notes: null,
          userId: '1', user: { id: '1', fullName: 'Administrador Principal' },
          customerId: '1', customer: { id: '1', taxId: 'J-12345678-4', name: 'Mi Negocio C.A.' },
          items: [{ id: 'i1', quantity: 2, price: 46.4, priceUsd: 0.25, discount: 0, subtotal: 92.8, taxRate: 16, taxAmount: 12.8, total: 105.6, productId: '1', product: { id: '1', name: 'Producto de prueba' } }],
          createdAt: new Date().toISOString()
        },
        {
          id: 's2', receiptNumber: 1002, documentType: 'TICKET', status: 'COMPLETED',
          subtotal: 50, taxTotal: 8, discount: 5, total: 53,
          payments: [{ id: 'p2', method: 'TRANSFER', amountBs: 53, reference: 'Pago movil' }], usdRate: 48.5, notes: 'Pago movil',
          userId: '2', user: { id: '2', fullName: 'Vendedor Uno' },
          customerId: null, customer: null,
          items: [{ id: 'i2', quantity: 5, price: 10.6, priceUsd: 0.25, discount: 0, subtotal: 53, taxRate: 16, taxAmount: 8, total: 61, productId: '1', product: { id: '1', name: 'Producto de prueba' } }],
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 's3', receiptNumber: 1003, documentType: 'FACTURA', status: 'CANCELLED',
          subtotal: 200, taxTotal: 32, discount: 10, total: 222,
          payments: [{ id: 'p3', method: 'DIVISA', amountBs: 222 }], usdRate: 49, notes: 'Anulacion: Error en monto',
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
    getActiveCashRegister: async () => {
      const reg = mockActiveRegister
      if (!reg) return { success: true, data: null }
      return {
        success: true,
        data: { id: reg.id, openingBalance: reg.openingBalance, openedAt: reg.openedAt, shiftConfig: reg.shiftConfig, openedBy: reg.openedBy }
      }
    },
    openRegister: async (data) => {
      const id = crypto.randomUUID()
      mockActiveRegister = {
        id,
        openingBalance: data.balance,
        openedAt: new Date().toISOString(),
        shiftConfig: null,
        openedBy: { fullName: 'Administrador Principal' }
      }
      mockMovements.length = 0
      mockMovements.push({ id: 'm1', type: 'OPENING', amount: data.balance, description: 'Apertura de caja', createdAt: new Date().toISOString(), user: { fullName: 'Administrador Principal' } })
      window.dispatchEvent(new CustomEvent('register:changed'))
      return { success: true, data: { id, openingBalance: data.balance } }
    },
    closeRegister: async (data) => {
      mockActiveRegister = null
      mockMovements.push({ id: 'm-close', type: 'CLOSING', amount: data.closingBalance ?? 0, description: 'Cierre de caja', createdAt: new Date().toISOString(), user: { fullName: 'Administrador Principal' } })
      window.dispatchEvent(new CustomEvent('register:changed'))
      return { success: true }
    },
    addCashMovement: async () => ({ success: true }),
    getCashSummary: async (_options) => {
      const reg = mockActiveRegister
      return {
        success: true,
        data: {
          registers: reg ? [{
            id: reg.id, openingBalance: reg.openingBalance, closingBalance: null, openedAt: reg.openedAt,
            openedBy: reg.openedBy,
            movements: mockMovements
          }] : [],
          sales: [
            { payments: [{ method: 'CASH', amountBs: 92.8 }] },
            { payments: [{ method: 'TRANSFER', amountBs: 53 }] },
            { payments: [{ method: 'CASH', amountBs: 120 }] }
          ]
        }
      }
    },
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
    getConfig: async () => ({ success: true, data: { country: '', currencySymbol: '$', usdRate: 1, usdRateSource: 'manual', usdAutoUpdate: false, taxRateDefault: 0, lowStockThreshold: 10, darkMode: false, inactivityTimeout: 600 } }),
    getCountryPlugin: async () => {
      const active = readPluginState('plugin-ve', true)
      if (!active) return { success: true, data: null }
      return {
        success: true,
        data: {
          countryCode: 'VE',
          countryName: 'Venezuela',
          currencySymbol: 'Bs.',
          currencyCode: 'VES',
          taxIdLabel: 'RIF',
          paymentMethods: [
            { id: 'CASH', label: 'Efectivo' },
            { id: 'TRANSFER', label: 'Transferencia' },
            { id: 'DEBIT_CARD', label: 'Tarjeta de Débito' },
            { id: 'CREDIT_CARD', label: 'Tarjeta de Crédito' },
            { id: 'DIVISA', label: 'Divisa (USD)' }
          ],
          defaultTaxes: [
            { name: 'IVA General 16%', rate: 16.0, description: 'Impuesto al Valor Agregado' }
          ],
          defaultExchangeRate: 48.50,
          personTypes: [
            { value: 'V', label: 'Natural Venezolano', subtypes: [{ value: 'contribuyente', label: 'Contribuyente ordinario' }, { value: 'no_contribuyente', label: 'No contribuyente' }, { value: 'especial', label: 'Sujeto pasivo especial' }, { value: 'independiente', label: 'Trabajador independiente' }, { value: 'dependiente', label: 'Empleado / Dependiente' }] },
            { value: 'E', label: 'Natural Extranjero', subtypes: [{ value: 'contribuyente', label: 'Contribuyente ordinario' }, { value: 'no_contribuyente', label: 'No contribuyente' }, { value: 'independiente', label: 'Trabajador independiente' }] },
            { value: 'J', label: 'Jurídico', subtypes: [{ value: 'contribuyente', label: 'Contribuyente ordinario' }, { value: 'especial', label: 'Sujeto pasivo especial' }, { value: 'no_contribuyente', label: 'No contribuyente' }] },
            { value: 'G', label: 'Gobierno', subtypes: [{ value: 'gobierno', label: 'Ente gubernamental' }] },
            { value: 'P', label: 'Pasaporte', subtypes: [{ value: 'no_contribuyente', label: 'No contribuyente' }] }
          ],
          fiscalAuthority: {
            name: 'SENIAT',
            description: 'Configuracion para facturacion electronica ante el SENIAT.',
            electronicInvoiceLabel: 'Facturacion electronica SENIAT',
            electronicInvoiceDescription: 'Habilita el envio automatico de facturas al SENIAT',
            autoSendLabel: 'Envio automatico',
            autoSendDescription: 'Envia facturas automaticamente al generarlas'
          }
        }
      }
    },
    getCountryConfig: async () => ({ success: true, data: { country: '' } }),
    updateConfig: async (data) => ({ success: true, data }),
    testPrinter: async () => ({ success: false, error: 'PLUGIN_NOT_AVAILABLE' }),
    printReceipt: async () => ({ success: false, error: 'PLUGIN_NOT_AVAILABLE' }),
    getPrinterStatus: async () => ({ success: false, error: 'PLUGIN_NOT_AVAILABLE' }),
    openDrawer: async () => ({ success: false, error: 'PLUGIN_NOT_AVAILABLE' }),
    checkPrinterLicense: async () => ({ success: true, data: { valid: false, message: 'Plugin fiscal no instalado' } }),
    getFiscalConfig: async () => ({ success: true, data: { printerType: 'bixolon', printerPort: 'COM1', printerEnabled: false, seniatEnabled: false, autoSendSeniat: false } }),
    updateFiscalConfig: async (data) => ({ success: true, data }),
    // Users
    listUsers: async () => ({
      success: true,
      data: [
        { id: '1', username: 'admin', fullName: 'Administrador Principal', role: 'superadmin', roleId: 'role-superadmin', active: true },
        { id: '2', username: 'vendedor1', fullName: 'Vendedor Uno', role: 'seller', roleId: 'role-seller', active: true },
        { id: '3', username: 'vendedor2', fullName: 'Vendedor Dos', role: 'seller', roleId: 'role-seller', active: false }
      ]
    }),
    createUser: async (input) => ({
      success: true,
      data: { id: crypto.randomUUID(), ...input, role: 'seller', active: true }
    }),
    updateUser: async (_id, input) => ({
      success: true,
      data: { id: '1', username: 'admin', fullName: input.fullName ?? 'Administrador Principal', role: 'superadmin', roleId: 'role-superadmin', active: true }
    }),
    toggleUserActive: async (id) => ({
      success: true,
      data: { id, username: 'mock', fullName: 'Mock User', role: 'seller', roleId: 'role-seller', active: true }
    }),
    // Roles & Permissions
    listRoles: async () => ({
      success: true,
      data: [
        { id: 'role-superadmin', name: 'superadmin', description: 'Acceso total al sistema', editable: false, permissions: ['inventory.view', 'inventory.write', 'taxes.view', 'taxes.write', 'customers.view', 'customers.write', 'sales.view', 'sales.write', 'cash.view', 'cash.write', 'reports.view', 'config.view', 'config.write', 'printer.view', 'admin.view', 'admin.write'], userCount: 1, createdAt: new Date().toISOString() },
        { id: 'role-admin', name: 'admin', description: 'Gestion y configuracion', editable: false, permissions: ['inventory.view', 'inventory.write', 'taxes.view', 'taxes.write', 'customers.view', 'customers.write', 'sales.view', 'sales.write', 'cash.view', 'cash.write', 'reports.view', 'config.view', 'printer.view'], userCount: 0, createdAt: new Date().toISOString() },
        { id: 'role-seller', name: 'seller', description: 'Punto de venta', editable: false, permissions: ['inventory.view', 'customers.view', 'customers.write', 'sales.view', 'sales.write', 'cash.view', 'reports.view'], userCount: 2, createdAt: new Date().toISOString() }
      ]
    }),
    createRole: async (input) => ({
      success: true,
      data: { id: crypto.randomUUID(), name: input.name, description: input.description, editable: true, permissions: input.permissions }
    }),
    updateRole: async (_id, input) => ({
      success: true,
      data: { id: _id, name: input.name ?? 'role', description: input.description, editable: true, permissions: input.permissions ?? [] }
    }),
    deleteRole: async () => ({ success: true }),
    listPermissions: async () => ({
      success: true,
      data: [
        { id: 'p1', handler: 'inventory.view', description: 'Ver inventario', category: 'inventory' },
        { id: 'p2', handler: 'inventory.write', description: 'Crear/editar productos', category: 'inventory' },
        { id: 'p3', handler: 'taxes.view', description: 'Ver impuestos', category: 'taxes' },
        { id: 'p4', handler: 'taxes.write', description: 'Crear/editar impuestos', category: 'taxes' },
        { id: 'p5', handler: 'customers.view', description: 'Ver clientes', category: 'customers' },
        { id: 'p6', handler: 'customers.write', description: 'Crear/editar clientes', category: 'customers' },
        { id: 'p7', handler: 'sales.view', description: 'Ver ventas', category: 'sales' },
        { id: 'p8', handler: 'sales.write', description: 'Crear/anular ventas', category: 'sales' },
        { id: 'p9', handler: 'cash.view', description: 'Ver caja', category: 'cash' },
        { id: 'p10', handler: 'cash.write', description: 'Gestionar caja', category: 'cash' },
        { id: 'p11', handler: 'reports.view', description: 'Ver reportes', category: 'reports' },
        { id: 'p12', handler: 'config.view', description: 'Ver configuracion', category: 'config' },
        { id: 'p13', handler: 'config.write', description: 'Editar configuracion', category: 'config' },
        { id: 'p14', handler: 'printer.view', description: 'Imprimir', category: 'printer' },
        { id: 'p15', handler: 'admin.view', description: 'Ver administracion', category: 'admin' },
        { id: 'p16', handler: 'admin.write', description: 'Gestionar usuarios/roles', category: 'admin' }
      ]
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
    },
    subscribeUiRegistry: async () => ({ success: true, data: { menuItems: [], routes: [], settingsTabs: [] } }),

    // Shift Config (mock)
    listShiftConfigs: async () => ({
      success: true,
      data: [
        { id: 'shift-1', name: 'Turno Mañana', days: JSON.stringify([1,2,3,4,5]), startTime: '08:00', endTime: '14:00', order: 1, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'shift-2', name: 'Turno Tarde', days: JSON.stringify([1,2,3,4,5]), startTime: '14:00', endTime: '20:00', order: 2, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ]
    }),
    saveShiftConfig: async (data) => ({ success: true, data: { id: data.id ?? crypto.randomUUID(), ...data, days: JSON.stringify(data.days), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }),
    deleteShiftConfig: async () => ({ success: true }),

    // Quotations (mock)
    createQuotation: async (input) => {
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + 30)
      return {
        success: true,
        data: {
          id: crypto.randomUUID(),
          number: Math.floor(Math.random() * 1000) + 1,
          status: 'DRAFT',
          validUntil: validUntil.toISOString(),
          subtotal: 100,
          taxTotal: 16,
          discount: 0,
          total: 116,
          usdRate: 48.5,
          notes: input.notes ?? null,
          userId: input.userId ?? 'mock-id',
          user: { id: 'mock-id', username: 'admin', fullName: 'Admin' },
          customerId: input.customerId ?? null,
          customer: null,
          items: (input.items ?? []).map((item, i) => ({
            id: `qi-${i}`,
            quantity: item.quantity,
            priceUsd: item.priceUsd,
            discount: item.discount ?? 0,
            subtotal: item.quantity * item.priceUsd,
            taxRate: 16,
            taxAmount: item.quantity * item.priceUsd * 0.16,
            total: item.quantity * item.priceUsd * 1.16,
            productId: item.productId,
            product: { id: item.productId, code: 'MOCK', name: 'Producto Mock', priceUsd: item.priceUsd, price: item.priceUsd * 48.5, stock: 100, active: true }
          })),
          convertedToSaleId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    },
    listQuotations: async () => ({ success: true, data: [] }),
    getQuotation: async () => ({ success: false, error: 'No implementado en modo browser' }),
    convertQuotationToSale: async () => ({ success: false, error: 'No implementado en modo browser' }),
    cancelQuotation: async () => ({ success: false, error: 'No implementado en modo browser' })
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
