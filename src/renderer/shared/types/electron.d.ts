import type { IpcResponse, AuthSession, LoginRequest, Product, Sale, CompanyConfig } from '@shared/types'

interface ElectronAPI {
  // Auth
  login: (credentials: LoginRequest) => Promise<IpcResponse<AuthSession>>
  logout: () => Promise<IpcResponse>
  getSession: () => Promise<IpcResponse<AuthSession | null>>

  // Products
  listProducts: (activeOnly?: boolean) => Promise<IpcResponse<Product[]>>
  searchProducts: (query: string) => Promise<IpcResponse<Product[]>>
  createProduct: (product: unknown) => Promise<IpcResponse<Product>>
  updateProduct: (id: string, product: unknown) => Promise<IpcResponse<Product>>
  deleteProduct: (id: string) => Promise<IpcResponse>

  // Categories
  listCategories: () => Promise<IpcResponse<{ id: string; name: string; color?: string }[]>>
  createCategory: (name: string, color?: string) => Promise<IpcResponse<{ id: string; name: string; color?: string }>>
  updateCategory: (id: string, name: string, color?: string) => Promise<IpcResponse<{ id: string; name: string; color?: string }>>
  deleteCategory: (id: string) => Promise<IpcResponse>

  // Taxes
  listTaxes: () => Promise<IpcResponse<import('@shared/types').Tax[]>>
  createTax: (input: { name: string; rate: number; description?: string }) => Promise<IpcResponse<import('@shared/types').Tax>>
  updateTax: (id: string, input: { name?: string; rate?: number; description?: string; active?: boolean }) => Promise<IpcResponse<import('@shared/types').Tax>>

  // Customers
  listCustomers: () => Promise<IpcResponse<import('@shared/types').Customer[]>>
  searchCustomers: (query: string) => Promise<IpcResponse<import('@shared/types').Customer[]>>
  findCustomerByTaxId: (taxId: string) => Promise<IpcResponse<import('@shared/types').Customer | null>>
  createCustomer: (input: { taxId: string; name: string; address?: string; phone?: string; email?: string }) => Promise<IpcResponse<import('@shared/types').Customer>>
  updateCustomer: (id: string, input: { name?: string; address?: string; phone?: string; email?: string; active?: boolean }) => Promise<IpcResponse<import('@shared/types').Customer>>
  deleteCustomer: (id: string) => Promise<IpcResponse>

  // Sales
  createSale: (sale: {
    items: Array<{ productId: string; quantity: number; priceUsd: number; discount?: number }>
    documentType: import('@shared/types').DocumentType
    paymentMethod: string
    cashAmount?: number
    discount?: number
    usdRate: number
    notes?: string
    userId: string
    customerId?: string
  }) => Promise<IpcResponse<Sale>>
  listSales: (filters?: import('@shared/types').SaleFilters) => Promise<IpcResponse<Sale[]>>
  cancelSale: (id: string, userId: string, reason?: string) => Promise<IpcResponse<Sale>>
  getNextReceiptNumber: () => Promise<IpcResponse<number>>

  // Cash Register
  openRegister: (balance: number) => Promise<IpcResponse>
  closeRegister: (registerId: string) => Promise<IpcResponse>
  getCashSummary: (date: string) => Promise<IpcResponse>

  // USD Rate
  getUsdRate: () => Promise<IpcResponse<{ rate: number; source: string }>>

  // Config
  getConfig: () => Promise<IpcResponse<{ usdRate: number; usdRateSource: string; currencySymbol: string } & Record<string, unknown>>>
  updateConfig: (config: Record<string, unknown>) => Promise<IpcResponse>

  // Company
  getCompanyConfig: () => Promise<IpcResponse<CompanyConfig>>
  updateCompanyConfig: (config: Partial<CompanyConfig>) => Promise<IpcResponse<CompanyConfig>>

  // Printer
  testPrinter: () => Promise<IpcResponse>
  printReceipt: (data: unknown) => Promise<IpcResponse>

  // Users
  listUsers: () => Promise<IpcResponse<User[]>>
  createUser: (input: { username: string; password: string; fullName: string; role: User['role'] }) => Promise<IpcResponse<User>>
  updateUser: (id: string, input: { fullName?: string; role?: User['role']; password?: string }) => Promise<IpcResponse<User>>
  toggleUserActive: (id: string) => Promise<IpcResponse<User>>

  // Plugins
  listPlugins: () => Promise<IpcResponse<Array<{ id: string; name: string; version: string; description?: string; enabled: boolean; visibility?: string; target?: string; hooks?: string[] }>>>
  installPlugin: (source: string) => Promise<IpcResponse>
  togglePluginActive: (id: string) => Promise<IpcResponse<{ active: boolean }>>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
