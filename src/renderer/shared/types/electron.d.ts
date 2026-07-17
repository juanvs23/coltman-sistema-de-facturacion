import type { IpcResponse, AuthSession, LoginRequest, Product, Sale } from '@shared/types'

interface ElectronAPI {
  // Auth
  login: (credentials: LoginRequest) => Promise<IpcResponse<AuthSession>>
  logout: () => Promise<IpcResponse>
  getSession: () => Promise<IpcResponse<AuthSession | null>>

  // Products
  listProducts: () => Promise<IpcResponse<Product[]>>
  searchProducts: (query: string) => Promise<IpcResponse<Product[]>>
  createProduct: (product: unknown) => Promise<IpcResponse<Product>>

  // Sales
  createSale: (sale: unknown) => Promise<IpcResponse<Sale>>
  listSales: (filters?: unknown) => Promise<IpcResponse<Sale[]>>
  cancelSale: (id: string, userId: string) => Promise<IpcResponse<Sale>>

  // Cash Register
  openRegister: (balance: number) => Promise<IpcResponse>
  closeRegister: (registerId: string) => Promise<IpcResponse>
  getCashSummary: (date: string) => Promise<IpcResponse>

  // USD Rate
  getUsdRate: () => Promise<IpcResponse<{ rate: number }>>

  // Config
  getConfig: () => Promise<IpcResponse>
  updateConfig: (config: unknown) => Promise<IpcResponse>

  // Printer
  testPrinter: () => Promise<IpcResponse>
  printReceipt: (data: unknown) => Promise<IpcResponse>

  // Plugins
  listPlugins: () => Promise<IpcResponse>
  installPlugin: (source: string) => Promise<IpcResponse>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
