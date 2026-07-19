import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { prisma } from './infrastructure/persistence/prisma'
import { LicenseManager } from './core/license/LicenseManager'
import { PluginLoader } from './plugins/PluginLoader'
import { PrismaUserRepository } from './infrastructure/persistence/PrismaUserRepository'
import { PrismaProductRepository } from './infrastructure/persistence/PrismaProductRepository'
import { PrismaCustomerRepository } from './infrastructure/persistence/PrismaCustomerRepository'
import { VenezuelaPlugin } from './country/ve/VenezuelaPlugin'
import { registerIpcHandlers } from './ipc/handlers'

export const licenseManager = new LicenseManager()
export const pluginLoader = new PluginLoader(licenseManager)

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // In development, load from vite dev server
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  const userRepository = new PrismaUserRepository(prisma)
  const productRepository = new PrismaProductRepository()
  const customerRepository = new PrismaCustomerRepository()
  registerIpcHandlers({ pluginLoader, userRepository, productRepository, customerRepository })
  await pluginLoader.loadPlugins()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
