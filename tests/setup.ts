import '@testing-library/jest-dom'

// Mock electronAPI for tests
window.electronAPI = {
  login: async () => ({ success: false, error: 'Mock: Not implemented' }),
  logout: async () => ({ success: true }),
  getSession: async () => ({ success: false, data: null }),
  listProducts: async () => ({ success: false, error: 'Mock: Not implemented' }),
  searchProducts: async () => ({ success: false, error: 'Mock: Not implemented' }),
  createProduct: async () => ({ success: false, error: 'Mock: Not implemented' }),
  createSale: async () => ({ success: false, error: 'Mock: Not implemented' }),
  listSales: async () => ({ success: false, error: 'Mock: Not implemented' }),
  cancelSale: async () => ({ success: false, error: 'Mock: Not implemented' }),
  openRegister: async () => ({ success: false, error: 'Mock: Not implemented' }),
  closeRegister: async () => ({ success: false, error: 'Mock: Not implemented' }),
  getCashSummary: async () => ({ success: false, error: 'Mock: Not implemented' }),
  getUsdRate: async () => ({ success: false, error: 'Mock: Not implemented' }),
  getConfig: async () => ({ success: false, error: 'Mock: Not implemented' }),
  updateConfig: async () => ({ success: false, error: 'Mock: Not implemented' }),
  testPrinter: async () => ({ success: false, error: 'Mock: Not implemented' }),
  printReceipt: async () => ({ success: false, error: 'Mock: Not implemented' }),
  listPlugins: async () => ({ success: true, data: [] }),
  installPlugin: async () => ({ success: false, error: 'Mock: Not implemented' })
} as unknown as Window['electronAPI']
