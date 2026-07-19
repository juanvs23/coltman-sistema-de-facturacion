import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    ipcRenderer.invoke('auth:login', credentials),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getSession: () => ipcRenderer.invoke('auth:session'),

  // Products
  listProducts: (activeOnly?: boolean) => ipcRenderer.invoke('products:list', activeOnly),
  searchProducts: (query: string) => ipcRenderer.invoke('products:search', query),
  createProduct: (product: unknown) => ipcRenderer.invoke('products:create', product),
  updateProduct: (id: string, product: unknown) => ipcRenderer.invoke('products:update', id, product),
  deleteProduct: (id: string) => ipcRenderer.invoke('products:delete', id),

  // Categories
  listCategories: () => ipcRenderer.invoke('categories:list'),
  createCategory: (name: string, color?: string) => ipcRenderer.invoke('categories:create', name, color),
  updateCategory: (id: string, name: string, color?: string) => ipcRenderer.invoke('categories:update', id, name, color),
  deleteCategory: (id: string) => ipcRenderer.invoke('categories:delete', id),

  // Taxes
  listTaxes: () => ipcRenderer.invoke('taxes:list'),
  createTax: (input: { name: string; rate: number; description?: string }) => ipcRenderer.invoke('taxes:create', input),
  updateTax: (id: string, input: { name?: string; rate?: number; description?: string; active?: boolean }) => ipcRenderer.invoke('taxes:update', id, input),

  // Customers
  listCustomers: () => ipcRenderer.invoke('customers:list'),
  searchCustomers: (query: string) => ipcRenderer.invoke('customers:search', query),
  findCustomerByTaxId: (taxId: string) => ipcRenderer.invoke('customers:find-by-tax-id', taxId),
  createCustomer: (input: { taxId: string; name: string; address?: string; phone?: string; email?: string }) => ipcRenderer.invoke('customers:create', input),
  updateCustomer: (id: string, input: { name?: string; address?: string; phone?: string; email?: string; active?: boolean }) => ipcRenderer.invoke('customers:update', id, input),
  deleteCustomer: (id: string) => ipcRenderer.invoke('customers:delete', id),

  // Sales
  createSale: (sale: unknown) => ipcRenderer.invoke('sales:create', sale),
  listSales: (filters?: unknown) => ipcRenderer.invoke('sales:list', filters),
  cancelSale: (id: string, userId: string, reason?: string) => ipcRenderer.invoke('sales:cancel', id, userId, reason),
  getNextReceiptNumber: () => ipcRenderer.invoke('sales:next-receipt-number'),

  // Cash Register
  openRegister: (balance: number) => ipcRenderer.invoke('cash:open', balance),
  closeRegister: (registerId: string) => ipcRenderer.invoke('cash:close', registerId),
  getCashSummary: (date: string) => ipcRenderer.invoke('cash:summary', date),

  // USD Rate
  getUsdRate: () => ipcRenderer.invoke('usd:rate'),

  // Config
  getConfig: () => ipcRenderer.invoke('config:get'),
  updateConfig: (config: unknown) => ipcRenderer.invoke('config:update', config),

  // Company
  getCompanyConfig: () => ipcRenderer.invoke('company:get'),
  updateCompanyConfig: (config: unknown) => ipcRenderer.invoke('company:update', config),

  // Printer
  testPrinter: () => ipcRenderer.invoke('printer:test'),
  printReceipt: (data: unknown) => ipcRenderer.invoke('printer:print-receipt', data),

  // Users
  listUsers: () => ipcRenderer.invoke('users:list'),
  createUser: (input: { username: string; password: string; fullName: string; role: string }) =>
    ipcRenderer.invoke('users:create', input),
  updateUser: (id: string, input: { fullName?: string; role?: string; password?: string }) =>
    ipcRenderer.invoke('users:update', id, input),
  toggleUserActive: (id: string) => ipcRenderer.invoke('users:toggle-active', id),

  // Plugins
  listPlugins: () => ipcRenderer.invoke('plugins:list'),
  installPlugin: (source: string) => ipcRenderer.invoke('plugins:install', source),
  togglePluginActive: (id: string) => ipcRenderer.invoke('plugins:toggle-active', id)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
