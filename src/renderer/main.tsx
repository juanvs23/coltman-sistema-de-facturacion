import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Dev mock: permite probar UI desde navegador sin Electron
if (!window.electronAPI) {
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
    listProducts: async () => ({ success: false, error: 'No implementado en modo browser' }),
    searchProducts: async () => ({ success: false, error: 'No implementado en modo browser' }),
    createProduct: async () => ({ success: false, error: 'No implementado en modo browser' }),
    createSale: async () => ({ success: false, error: 'No implementado en modo browser' }),
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
    listPlugins: async () => ({ success: false, data: [] }),
    installPlugin: async () => ({ success: false, error: 'No implementado en modo browser' })
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
