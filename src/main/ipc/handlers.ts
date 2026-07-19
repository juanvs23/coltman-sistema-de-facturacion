import { ipcMain } from 'electron'
import bcrypt from 'bcryptjs'
import { prisma } from '../infrastructure/persistence/prisma'
import type { PluginLoader } from '../plugins/PluginLoader'
import type { IUserRepository } from '../core/ports/IUserRepository'
import type { IProductRepository } from '../core/ports/IProductRepository'
import type { ICustomerRepository } from '../core/ports/ICustomerRepository'
import type { ISaleRepository, SaleFilters } from '../core/ports/ISaleRepository'

export function validateSaleInput(input: {
  documentType: string
  customerId?: string
}): { valid: boolean; error?: string } {
  if (input.documentType === 'FACTURA' && !input.customerId) {
    return { valid: false, error: 'CUSTOMER_REQUIRED_FOR_FACTURA' }
  }
  return { valid: true }
}

/**
 * Registra todos los manejadores IPC.
 */
export function registerIpcHandlers(deps: {
  pluginLoader: PluginLoader
  userRepository?: IUserRepository
  productRepository?: IProductRepository
  customerRepository?: ICustomerRepository
  saleRepository?: ISaleRepository
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
  const productRepo = deps.productRepository

  if (productRepo) {
    ipcMain.handle('products:list', async (_event, activeOnly?: boolean) => {
      try {
        const products = await productRepo.findAll(activeOnly)
        return { success: true, data: products }
      } catch (error) {
        return { success: false, error: 'Error al listar productos' }
      }
    })

    ipcMain.handle('products:search', async (_event, query: string) => {
      try {
        const products = await productRepo.search(query)
        return { success: true, data: products }
      } catch (error) {
        return { success: false, error: 'Error al buscar productos' }
      }
    })

    ipcMain.handle('products:create', async (_event, input) => {
      try {
        const product = await productRepo.create(input)
        return { success: true, data: product }
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          return { success: false, error: 'El código de producto ya existe' }
        }
        return { success: false, error: 'Error al crear producto' }
      }
    })

    ipcMain.handle('products:update', async (_event, id: string, input) => {
      try {
        const product = await productRepo.update(id, input)
        return { success: true, data: product }
      } catch (error) {
        return { success: false, error: 'Error al actualizar producto' }
      }
    })

    ipcMain.handle('products:delete', async (_event, id: string) => {
      try {
        await productRepo.delete(id)
        return { success: true }
      } catch (error) {
        return { success: false, error: 'Error al eliminar producto' }
      }
    })

    ipcMain.handle('categories:list', async () => {
      try {
        const categories = await productRepo.findCategories()
        return { success: true, data: categories }
      } catch (error) {
        return { success: false, error: 'Error al listar categorías' }
      }
    })

    ipcMain.handle('categories:create', async (_event, name: string, color?: string) => {
      try {
        const category = await productRepo.createCategory(name, color)
        return { success: true, data: category }
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          return { success: false, error: 'La categoría ya existe' }
        }
        return { success: false, error: 'Error al crear categoría' }
      }
    })

    ipcMain.handle('categories:update', async (_event, id: string, name: string, color?: string) => {
      try {
        const category = await productRepo.updateCategory(id, name, color)
        return { success: true, data: category }
      } catch (error) {
        return { success: false, error: 'Error al actualizar categoría' }
      }
    })

    ipcMain.handle('categories:delete', async (_event, id: string) => {
      try {
        await productRepo.deleteCategory(id)
        return { success: true }
      } catch (error) {
        return { success: false, error: 'Error al eliminar categoría' }
      }
    })

    // ─── Taxes ─────────────────────────────────────────────
    ipcMain.handle('taxes:list', async () => {
      try {
        const taxes = await productRepo.findAllTaxes()
        return { success: true, data: taxes }
      } catch (error) {
        return { success: false, error: 'Error al listar impuestos' }
      }
    })

    ipcMain.handle('taxes:create', async (_event, input: { name: string; rate: number; description?: string }) => {
      try {
        const tax = await productRepo.createTax(input.name, input.rate, input.description)
        return { success: true, data: tax }
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          return { success: false, error: 'El impuesto ya existe' }
        }
        return { success: false, error: 'Error al crear impuesto' }
      }
    })

    ipcMain.handle('taxes:update', async (_event, id: string, input: { name?: string; rate?: number; description?: string; active?: boolean }) => {
      try {
        const tax = await productRepo.updateTax(id, input)
        return { success: true, data: tax }
      } catch (error) {
        return { success: false, error: 'Error al actualizar impuesto' }
      }
    })
  }

  // ─── Customers ──────────────────────────────────────────
  const customerRepo = deps.customerRepository

  if (customerRepo) {
    ipcMain.handle('customers:list', async () => {
      try {
        const customers = await customerRepo.list()
        return { success: true, data: customers }
      } catch { return { success: false, error: 'Error al listar clientes' } }
    })

    ipcMain.handle('customers:search', async (_event, query: string) => {
      try {
        const customers = await customerRepo.search(query)
        return { success: true, data: customers }
      } catch { return { success: false, error: 'Error al buscar clientes' } }
    })

    ipcMain.handle('customers:find-by-tax-id', async (_event, taxId: string) => {
      try {
        const customer = await customerRepo.findByTaxId(taxId)
        return { success: true, data: customer }
      } catch { return { success: false, error: 'Error al buscar cliente' } }
    })

    ipcMain.handle('customers:create', async (_event, input) => {
      try {
        const customer = await customerRepo.create(input)
        return { success: true, data: customer }
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          return { success: false, error: 'El RIF ya existe' }
        }
        return { success: false, error: 'Error al crear cliente' }
      }
    })

    ipcMain.handle('customers:update', async (_event, id: string, input) => {
      try {
        const customer = await customerRepo.update(id, input)
        return { success: true, data: customer }
      } catch { return { success: false, error: 'Error al actualizar cliente' } }
    })

    ipcMain.handle('customers:delete', async (_event, id: string) => {
      try {
        await customerRepo.delete(id)
        return { success: true }
      } catch { return { success: false, error: 'Error al eliminar cliente' } }
    })
  }

  // ─── Sales ───────────────────────────────────────────────
  ipcMain.handle('sales:create', async (_event, input: {
    items: Array<{ productId: string; quantity: number; priceUsd: number; discount?: number }>
    documentType: string
    paymentMethod: string
    cashAmount?: number
    discount?: number
    usdRate?: number
    notes?: string
    userId: string
    customerId?: string
  }) => {
    try {
      // Validate customer required for FACTURA
      const validation = validateSaleInput({ documentType: input.documentType, customerId: input.customerId })
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Get current USD rate
      const config = await prisma.appConfig.findUnique({ where: { id: 'default' } })
      const rate = input.usdRate ?? config?.usdRate ?? 0
      if (rate <= 0) return { success: false, error: 'Tasa USD no configurada' }

      // Generate receipt number
      const lastSale = await prisma.sale.findFirst({ orderBy: { receiptNumber: 'desc' }, select: { receiptNumber: true } })
      const receiptNumber = (lastSale?.receiptNumber ?? 0) + 1

      // Calculate totals and build sale items
      let subtotalUsd = 0
      let taxTotalUsd = 0
      let discountTotalUsd = 0
      const saleItemsData: Array<{
        quantity: number; price: number; priceUsd: number; discount: number; subtotal: number
        taxRate: number; taxAmount: number; taxBreakdown: string; total: number
        productId: string
      }> = []

      for (const item of input.items) {
        // Verify product exists and has stock
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { taxes: { include: { tax: true } } }
        })
        if (!product) return { success: false, error: `Producto no encontrado: ${item.productId}` }
        if (!product.active) return { success: false, error: `Producto inactivo: ${product.name}` }
        if (product.type === 'PRODUCT' && product.stock < item.quantity) {
          return { success: false, error: `Stock insuficiente: ${product.name} (disponible: ${product.stock})` }
        }

        const priceUsd = item.priceUsd
        const lineDiscountUsd = item.discount ?? 0
        const priceBs = priceUsd * rate
        const itemSubtotalUsd = (priceUsd * item.quantity) - lineDiscountUsd

        discountTotalUsd += lineDiscountUsd

        // Calculate taxes from product tax associations (on discounted subtotal)
        const taxBreakdown: Array<{ taxId: string; name: string; rate: number; amount: number }> = []
        let combinedRate = 0

        for (const pt of product.taxes) {
          if (pt.tax.active) {
            const taxAmount = itemSubtotalUsd * (pt.tax.rate / 100)
            taxBreakdown.push({
              taxId: pt.tax.id,
              name: pt.tax.name,
              rate: pt.tax.rate,
              amount: taxAmount
            })
            combinedRate += pt.tax.rate
          }
        }

        const itemTaxUsd = taxBreakdown.reduce((sum, t) => sum + t.amount, 0)
        const itemTotalUsd = itemSubtotalUsd + itemTaxUsd

        subtotalUsd += itemSubtotalUsd
        taxTotalUsd += itemTaxUsd

        saleItemsData.push({
          quantity: item.quantity,
          price: priceBs,
          priceUsd,
          discount: lineDiscountUsd,
          subtotal: itemSubtotalUsd * rate,
          taxRate: combinedRate,
          taxAmount: itemTaxUsd * rate,
          taxBreakdown: JSON.stringify(taxBreakdown),
          total: itemTotalUsd * rate,
          productId: item.productId
        })
      }

      // Apply global discount after taxes (VE fiscal rule)
      const globalDiscountUsd = input.discount ?? 0
      const totalUsd = subtotalUsd + taxTotalUsd - globalDiscountUsd

      // Create sale in a transaction
      const sale = await prisma.$transaction(async (tx) => {
        // Create the sale
        const created = await tx.sale.create({
          data: {
            receiptNumber,
            documentType: input.documentType as 'FACTURA' | 'TICKET',
            status: 'COMPLETED',
            subtotal: subtotalUsd * rate,
            taxTotal: taxTotalUsd * rate,
            discount: discountTotalUsd + globalDiscountUsd,
            total: totalUsd * rate,
            paymentMethod: input.paymentMethod as never,
            cashAmount: input.cashAmount ? input.cashAmount * rate : null,
            usdRate: rate,
            notes: input.notes ?? null,
            userId: input.userId,
            customerId: input.customerId ?? null,
            items: {
              create: saleItemsData
            }
          },
          include: { items: { include: { product: true } }, user: true }
        })

        // Deduct stock for each product
        for (const item of input.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } })
          if (product && product.type === 'PRODUCT') {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            })
          }
        }

        return created
      })

      return { success: true, data: sale }
    } catch (error) {
      console.error('sales:create error:', error)
      return { success: false, error: 'Error al crear la venta' }
    }
  })

  const saleRepo = deps.saleRepository

  ipcMain.handle('sales:list', async (_event, filters?: SaleFilters) => {
    try {
      if (!saleRepo) return { success: false, error: 'Repositorio de ventas no disponible' }
      const sales = await saleRepo.findAll(filters)
      return { success: true, data: sales }
    } catch (error) {
      return { success: false, error: 'Error al listar ventas' }
    }
  })

  ipcMain.handle('sales:cancel', async (_event, id: string, userId: string, reason?: string) => {
    try {
      if (!saleRepo) return { success: false, error: 'Repositorio de ventas no disponible' }
      const sale = await saleRepo.cancel(id, userId, reason)
      return { success: true, data: sale }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al anular venta'
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('sales:next-receipt-number', async () => {
    try {
      const last = await prisma.sale.findFirst({
        orderBy: { receiptNumber: 'desc' },
        select: { receiptNumber: true }
      })
      const nextNumber = (last?.receiptNumber ?? 0) + 1
      return { success: true, data: nextNumber }
    } catch (error) {
      return { success: false, error: 'Error al obtener número de factura' }
    }
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
    try {
      const config = await prisma.appConfig.findUnique({ where: { id: 'default' } })
      return { success: true, data: { rate: config?.usdRate ?? 0, source: config?.usdRateSource ?? 'manual' } }
    } catch (error) {
      return { success: false, error: 'Error al obtener tasa USD' }
    }
  })

  // ─── Config ──────────────────────────────────────────────
  ipcMain.handle('config:get', async () => {
    try {
      const config = await prisma.appConfig.findUnique({ where: { id: 'default' } })
      return { success: true, data: config }
    } catch (error) {
      return { success: false, error: 'Error al obtener configuración' }
    }
  })

  ipcMain.handle('config:update', async (_event, data: Record<string, unknown>) => {
    try {
      const config = await prisma.appConfig.update({
        where: { id: 'default' },
        data: data as never
      })
      return { success: true, data: config }
    } catch (error) {
      return { success: false, error: 'Error al actualizar configuración' }
    }
  })

  // ─── Company Config ───────────────────────────────────────
  ipcMain.handle('company:get', async () => {
    try {
      let config = await prisma.companyConfig.findUnique({ where: { id: 'default' } })
      if (!config) {
        config = await prisma.companyConfig.create({
          data: { id: 'default', businessName: '' }
        })
      }
      return { success: true, data: config }
    } catch (error) {
      return { success: false, error: 'Error al obtener datos de la empresa' }
    }
  })

  ipcMain.handle('company:update', async (_event, data: Record<string, unknown>) => {
    try {
      const config = await prisma.companyConfig.upsert({
        where: { id: 'default' },
        create: { id: 'default', businessName: (data.businessName as string) ?? '', ...data },
        update: data as never
      })
      return { success: true, data: config }
    } catch (error) {
      return { success: false, error: 'Error al actualizar datos de la empresa' }
    }
  })

  // ─── Printer ─────────────────────────────────────────────
  ipcMain.handle('printer:test', async () => {
    return { success: false, error: 'Not implemented' }
  })

  ipcMain.handle('printer:print-receipt', async (_event, data) => {
    return { success: false, error: 'Not implemented' }
  })

  // ─── Users ────────────────────────────────────────────────
  const userRepo = deps.userRepository

  if (userRepo) {
    ipcMain.handle('users:list', async () => {
      try {
        const users = await userRepo.list()
        return { success: true, data: users }
      } catch (error) {
        return { success: false, error: 'Error al listar usuarios' }
      }
    })

    ipcMain.handle('users:create', async (_event, input: {
      username: string
      password: string
      fullName: string
      role: 'SELLER' | 'ADMIN' | 'SUPERADMIN'
    }) => {
      try {
        const user = await userRepo.create(input)
        return { success: true, data: user }
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          return { success: false, error: 'El nombre de usuario ya existe' }
        }
        return { success: false, error: 'Error al crear usuario' }
      }
    })

    ipcMain.handle('users:update', async (_event, id: string, input: {
      fullName?: string
      role?: 'SELLER' | 'ADMIN' | 'SUPERADMIN'
      password?: string
    }) => {
      try {
        const user = await userRepo.update(id, input)
        return { success: true, data: user }
      } catch (error) {
        return { success: false, error: 'Error al actualizar usuario' }
      }
    })

    ipcMain.handle('users:toggle-active', async (_event, id: string) => {
      try {
        const user = await userRepo.toggleActive(id)
        return { success: true, data: user }
      } catch (error) {
        return { success: false, error: 'Error al cambiar estado del usuario' }
      }
    })
  }

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

  ipcMain.handle('plugins:toggle-active', async (_event, id: string) => {
    try {
      const result = await deps.pluginLoader.togglePlugin(id)
      return result
    } catch (error) {
      return { success: false, error: 'Error al cambiar estado del plugin' }
    }
  })
}
