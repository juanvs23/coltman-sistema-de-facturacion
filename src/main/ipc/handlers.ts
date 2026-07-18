import { ipcMain } from 'electron'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import type { PluginLoader } from '../plugins/PluginLoader'

const prisma = new PrismaClient()

/**
 * Registra todos los manejadores IPC.
 */
export function registerIpcHandlers(deps: {
  pluginLoader: PluginLoader
}): void {
  // ─── Auth ────────────────────────────────────────────────
  ipcMain.handle('auth:login', async (_event, credentials: { username: string; password: string }) => {
    try {
      const user = await prisma.user.findUnique({ where: { username: credentials.username } })
      if (!user) {
        return { success: false, error: 'Usuario o contraseña incorrectos' }
      }
      if (!user.active) {
        return { success: false, error: 'Usuario inactivo' }
      }
      const valid = await bcrypt.compare(credentials.password, user.password)
      if (!valid) {
        return { success: false, error: 'Usuario o contraseña incorrectos' }
      }
      return {
        success: true,
        data: {
          userId: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          loggedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('auth:login error:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
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
    try {
      const plugins = await deps.pluginLoader.listPlugins()
      return { success: true, data: plugins }
    } catch (error) {
      return { success: false, error: 'Error al listar plugins' }
    }
  })

  ipcMain.handle('plugins:install', async (_event, source: string) => {
    const result = await deps.pluginLoader.installPlugin(source)
    return result
  })
}
