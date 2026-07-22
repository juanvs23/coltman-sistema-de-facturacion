import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { prisma } from './infrastructure/persistence/prisma'
import { LicenseManager } from './core/license/LicenseManager'
import { PluginLoader } from './plugins/PluginLoader'
import { AppKernel } from './core/kernel/AppKernel'
import { PrismaUserRepository } from './infrastructure/persistence/PrismaUserRepository'
import { PrismaProductRepository } from './infrastructure/persistence/PrismaProductRepository'
import { PrismaCustomerRepository } from './infrastructure/persistence/PrismaCustomerRepository'
import { PrismaSaleRepository } from './infrastructure/persistence/PrismaSaleRepository'
import { registerIpcHandlers } from './ipc/handlers'

export const licenseManager = new LicenseManager()

let mainWindow: BrowserWindow | null = null
let kernel: AppKernel | null = null
let pluginLoader: PluginLoader | null = null

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
  // 1. Initialize kernel first
  kernel = AppKernel.getInstance()
  await kernel.init(prisma, {} as never) // BrowserWindow will be set after createWindow

  // 2. Create PluginLoader with kernel reference
  pluginLoader = new PluginLoader(kernel, licenseManager)

  // 3. Register IPC handlers BEFORE loading plugins
  const userRepository = new PrismaUserRepository(prisma)
  const productRepository = new PrismaProductRepository()
  const customerRepository = new PrismaCustomerRepository()
  const saleRepository = new PrismaSaleRepository()
  registerIpcHandlers({
    pluginLoader,
    kernel,
    userRepository,
    productRepository,
    customerRepository,
    saleRepository
  })

  // 4. Load plugins
  await pluginLoader.loadPlugins()

  // 5. Create window
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
