import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    ipcRenderer.invoke('auth:login', credentials),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getSession: () => ipcRenderer.invoke('auth:session'),

  // Products
  listProducts: () => ipcRenderer.invoke('products:list'),
  searchProducts: (query: string) => ipcRenderer.invoke('products:search', query),
  createProduct: (product: unknown) => ipcRenderer.invoke('products:create', product),

  // Sales
  createSale: (sale: unknown) => ipcRenderer.invoke('sales:create', sale),
  listSales: (filters?: unknown) => ipcRenderer.invoke('sales:list', filters),
  cancelSale: (id: string, userId: string) => ipcRenderer.invoke('sales:cancel', id, userId),

  // Cash Register
  openRegister: (balance: number) => ipcRenderer.invoke('cash:open', balance),
  closeRegister: (registerId: string) => ipcRenderer.invoke('cash:close', registerId),
  getCashSummary: (date: string) => ipcRenderer.invoke('cash:summary', date),

  // USD Rate
  getUsdRate: () => ipcRenderer.invoke('usd:rate'),

  // Config
  getConfig: () => ipcRenderer.invoke('config:get'),
  updateConfig: (config: unknown) => ipcRenderer.invoke('config:update', config),

  // Printer
  testPrinter: () => ipcRenderer.invoke('printer:test'),
  printReceipt: (data: unknown) => ipcRenderer.invoke('printer:print-receipt', data),

  // Plugins
  listPlugins: () => ipcRenderer.invoke('plugins:list'),
  installPlugin: (source: string) => ipcRenderer.invoke('plugins:install', source)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
