import type { IpcResponse, AuthSession, LoginRequest, Product, Sale, CompanyConfig, UiRegistryState, CountryPluginData } from '@shared/types'

interface ElectronAPI {
  // Auth
  login: (credentials: LoginRequest) => Promise<IpcResponse<AuthSession>>
  logout: () => Promise<IpcResponse>
  getSession: () => Promise<IpcResponse<AuthSession | null>>
  unlock: (password: string) => Promise<IpcResponse<AuthSession>>

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
  createCustomer: (input: { taxId: string; name: string; personType?: string; personSubtype?: string; legalType?: string; address?: string; phone?: string; email?: string }) => Promise<IpcResponse<import('@shared/types').Customer>>
  updateCustomer: (id: string, input: { name?: string; personType?: string; personSubtype?: string; legalType?: string; address?: string; phone?: string; email?: string; active?: boolean }) => Promise<IpcResponse<import('@shared/types').Customer>>
  deleteCustomer: (id: string) => Promise<IpcResponse>

  // Sales
  createSale: (sale: {
    items: Array<{ productId: string; quantity: number; priceUsd: number; discount?: number }>
    documentType: import('@shared/types').DocumentType
    payments: Array<{ method: string; amountBs: number; reference?: string }>
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
  getActiveCashRegister: () => Promise<IpcResponse<{
    id: string
    openingBalance: number
    openedAt: string
    shiftConfig?: { id: string; name: string; startTime: string; endTime: string } | null
    openedBy?: { fullName: string } | null
  } | null>>
  openRegister: (data: { balance: number; shiftConfigId?: string; date: string; time: string }) => Promise<IpcResponse>
  closeRegister: (data: { registerId: string; closingBalance: number; date: string; time: string; userId: string }) => Promise<IpcResponse>
  getCashSummary: (options?: { date?: string }) => Promise<IpcResponse<{ registers: unknown[]; sales: unknown[] }>>
  addCashMovement: (data: { registerId: string; type: string; amount: number; description?: string; userId: string }) => Promise<IpcResponse>

  // Reports
  getDailyReport: (date?: string) => Promise<IpcResponse<{ date: string; sales: number; total: number; byMethod: Record<string, number> }>>
  getProductReport: () => Promise<IpcResponse<Array<{ name: string; quantity: number; total: number }>>>
  getUserReport: () => Promise<IpcResponse<Array<{ name: string; sales: number; total: number }>>>
  getIvaReport: (yearMonth?: string) => Promise<IpcResponse<{ period: string; entries: unknown[]; totals: { subtotal: number; taxTotal: number; total: number; discount: number } }>>

  // USD Rate
  getUsdRate: () => Promise<IpcResponse<{ rate: number; source: string; rateId: string | null }>>
  getUsdRateHistory: () => Promise<IpcResponse<Array<{ id: string; rate: number; source: string; notes: string | null; createdBy: string | null; createdAt: string }>>>

  // Config
  getConfig: () => Promise<IpcResponse<{ usdRate: number; usdRateSource: string; currencySymbol: string } & Record<string, unknown>>>
  updateConfig: (config: Record<string, unknown>) => Promise<IpcResponse>

  // Company
  getCompanyConfig: () => Promise<IpcResponse<CompanyConfig>>
  updateCompanyConfig: (config: Partial<CompanyConfig>) => Promise<IpcResponse<CompanyConfig>>

  // Printer
  testPrinter: () => Promise<IpcResponse>
  printReceipt: (data: unknown) => Promise<IpcResponse>
  getPrinterStatus: () => Promise<IpcResponse<{ online: boolean; paperOut: boolean; drawerOpen: boolean }>>
  openDrawer: () => Promise<IpcResponse>
  checkPrinterLicense: () => Promise<IpcResponse<{ valid: boolean; message: string }>>

  // Fiscal
  getFiscalConfig: () => Promise<IpcResponse<{ printerType: string; printerPort: string; printerEnabled: boolean; seniatEnabled: boolean; autoSendSeniat: boolean }>>
  updateFiscalConfig: (config: Partial<{ printerType: string; printerPort: string; printerEnabled: boolean; seniatEnabled: boolean; autoSendSeniat: boolean }>) => Promise<IpcResponse>

  // Users
  listUsers: () => Promise<IpcResponse<User[]>>
  createUser: (input: { username: string; password: string; fullName: string; roleId: string }) => Promise<IpcResponse<User>>
  updateUser: (id: string, input: { fullName?: string; roleId?: string; password?: string }) => Promise<IpcResponse<User>>
  toggleUserActive: (id: string) => Promise<IpcResponse<User>>

  // Roles & Permissions
  listRoles: () => Promise<IpcResponse<Array<{ id: string; name: string; description?: string; editable: boolean; permissions: string[]; userCount: number; createdAt: string }>>>
  createRole: (input: { name: string; description?: string; permissions: string[] }) => Promise<IpcResponse<{ id: string; name: string; description?: string; editable: boolean; permissions: string[] }>>
  updateRole: (id: string, input: { name?: string; description?: string; permissions?: string[] }) => Promise<IpcResponse<{ id: string; name: string; description?: string; editable: boolean; permissions: string[] }>>
  deleteRole: (id: string) => Promise<IpcResponse>
  listPermissions: () => Promise<IpcResponse<Array<{ id: string; handler: string; description: string; category: string }>>>

  // Plugins
  listPlugins: () => Promise<IpcResponse<Array<{ id: string; name: string; version: string; description?: string; enabled: boolean; visibility?: string; target?: string; hooks?: string[] }>>>
  installPlugin: (source: string) => Promise<IpcResponse>
  togglePluginActive: (id: string) => Promise<IpcResponse<{ active: boolean }>>

  // Shift Config
  listShiftConfigs: () => Promise<IpcResponse<import('@shared/types').ShiftConfigData[]>>
  saveShiftConfig: (data: { id?: string; name: string; days: number[]; startTime: string; endTime: string; order?: number; active?: boolean }) => Promise<IpcResponse<import('@shared/types').ShiftConfigData>>
  deleteShiftConfig: (id: string) => Promise<IpcResponse>

  // Quotations
  createQuotation: (data: import('@shared/types').CreateQuotationRequest) => Promise<IpcResponse<import('@shared/types').QuotationData>>
  listQuotations: (filters?: import('@shared/types').QuotationFilters) => Promise<IpcResponse<import('@shared/types').QuotationData[]>>
  getQuotation: (id: string) => Promise<IpcResponse<import('@shared/types').QuotationData>>
  convertQuotationToSale: (id: string) => Promise<IpcResponse<import('@shared/types').Sale>>
  cancelQuotation: (id: string) => Promise<IpcResponse<import('@shared/types').QuotationData>>

  // Kernel / Country Plugin
  getCountryPlugin: () => Promise<IpcResponse<CountryPluginData | null>>
  getCountryConfig: () => Promise<IpcResponse<{ country: string }>>

  // UI Registry
  subscribeUiRegistry?: () => Promise<IpcResponse<UiRegistryState>>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
