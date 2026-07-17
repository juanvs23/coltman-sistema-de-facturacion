import { ipcMain } from 'electron'

/**
 * Registra todos los manejadores IPC.
 * Los casos de uso se inyectarán aquí cuando estén implementados.
 */
export function registerIpcHandlers(): void {
  // ─── Auth ────────────────────────────────────────────────
  ipcMain.handle('auth:login', async (_event, credentials) => {
    // TODO: Implement with real auth service
    return { success: false, error: 'Not implemented' }
  })

  ipcMain.handle('auth:logout', async () => {
    return { success: true }
  })

  ipcMain.handle('auth:session', async () => {
    return { success: false, data: null }
  })

  // ─── Products ────────────────────────────────────────────
  ipcMain.handle('products:list', async () => {
    return { success: false, error: 'Not implemented' }
  })

  ipcMain.handle('products:search', async (_event, query: string) => {
    return { success: false, error: 'Not implemented' }
  })

  ipcMain.handle('products:create', async (_event, product) => {
    return { success: false, error: 'Not implemented' }
  })

  // ─── Sales ───────────────────────────────────────────────
  ipcMain.handle('sales:create', async (_event, sale) => {
    return { success: false, error: 'Not implemented' }
  })

  ipcMain.handle('sales:list', async (_event, filters) => {
    return { success: false, error: 'Not implemented' }
  })

  ipcMain.handle('sales:cancel', async (_event, id, userId) => {
    return { success: false, error: 'Not implemented' }
  })

  // ─── Cash Register ───────────────────────────────────────
  ipcMain.handle('cash:open', async (_event, balance) => {
    return { success: false, error: 'Not implemented' }
  })

  ipcMain.handle('cash:close', async (_event, registerId) => {
    return { success: false, error: 'Not implemented' }
  })

  ipcMain.handle('cash:summary', async (_event, date) => {
    return { success: false, error: 'Not implemented' }
  })

  // ─── USD Rate ────────────────────────────────────────────
  ipcMain.handle('usd:rate', async () => {
    return { success: false, error: 'Not implemented' }
  })

  // ─── Config ──────────────────────────────────────────────
  ipcMain.handle('config:get', async () => {
    return { success: false, error: 'Not implemented' }
  })

  ipcMain.handle('config:update', async (_event, config) => {
    return { success: false, error: 'Not implemented' }
  })

  // ─── Printer ─────────────────────────────────────────────
  ipcMain.handle('printer:test', async () => {
    return { success: false, error: 'Not implemented' }
  })

  ipcMain.handle('printer:print-receipt', async (_event, data) => {
    return { success: false, error: 'Not implemented' }
  })

  // ─── Plugins ─────────────────────────────────────────────
  ipcMain.handle('plugins:list', async () => {
    return { success: false, data: [] }
  })

  ipcMain.handle('plugins:install', async (_event, source) => {
    return { success: false, error: 'Not implemented' }
  })
}
