import { ipcMain } from 'electron'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../infrastructure/persistence/prisma'
import type { PluginLoader } from '../plugins/PluginLoader'
import type { IUserRepository } from '../core/ports/IUserRepository'
import type { IProductRepository } from '../core/ports/IProductRepository'
import type { ICustomerRepository } from '../core/ports/ICustomerRepository'
import type { ISaleRepository, SaleFilters } from '../core/ports/ISaleRepository'
import { guard, AuthError, validatePassword, invalidatePermissionCache } from './guards'
import { sessionManager } from './SessionManager'

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
  ipcMain.handle('auth:login', async (event, credentials: { username: string; password: string }) => {
    try {
      const user = await prisma.user.findUnique({
        where: { username: credentials.username },
        include: { role: true }
      })
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
      const sessionToken = crypto.randomUUID()
      const sessionData = {
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role.name,
        roleId: user.role.id,
        sessionToken,
        loggedAt: new Date().toISOString()
      }
      sessionManager.setSession(event.sender.id, sessionData)
      return {
        success: true,
        data: sessionData
      }
    } catch (error) {
      console.error('auth:login error:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
  })

  ipcMain.handle('auth:logout', async (event) => {
    sessionManager.removeSession(event.sender.id)
    return { success: true }
  })

  ipcMain.handle('auth:session', async (event) => {
    const session = sessionManager.getSession(event.sender.id)
    if (!session) {
      return { success: false, data: null }
    }
    return { success: true, data: session }
  })

  ipcMain.handle('auth:unlock', async (event, password: string) => {
    try {
      const session = sessionManager.getSession(event.sender.id)
      if (!session) {
        return { success: false, error: 'No hay sesión activa' }
      }
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { role: true }
      })
      if (!user || !user.active) {
        return { success: false, error: 'Usuario no encontrado o inactivo' }
      }
      const valid = await bcrypt.compare(password, user.password)
      if (!valid) {
        return { success: false, error: 'Contraseña incorrecta' }
      }
      sessionManager.setSession(event.sender.id, {
        ...session,
        loggedAt: new Date().toISOString()
      })
      return { success: true, data: session }
    } catch (error) {
      return { success: false, error: 'Error al desbloquear sesión' }
    }
  })

  // ─── Products ────────────────────────────────────────────
  const productRepo = deps.productRepository

  if (productRepo) {
    ipcMain.handle('products:list', async (event, activeOnly?: boolean) => {
      try {
        await guard(event, 'products:list')
        const products = await productRepo.findAll(activeOnly)
        return { success: true, data: products }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al listar productos' }
      }
    })

    ipcMain.handle('products:search', async (event, query: string) => {
      try {
        await guard(event, 'products:search')
        const products = await productRepo.search(query)
        return { success: true, data: products }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al buscar productos' }
      }
    })

    ipcMain.handle('products:create', async (event, input) => {
      try {
        await guard(event, 'products:create')
        const product = await productRepo.create(input)
        return { success: true, data: product }
      } catch (error: unknown) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          return { success: false, error: 'El código de producto ya existe' }
        }
        return { success: false, error: 'Error al crear producto' }
      }
    })

    ipcMain.handle('products:update', async (event, id: string, input) => {
      try {
        await guard(event, 'products:update')
        const product = await productRepo.update(id, input)
        return { success: true, data: product }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al actualizar producto' }
      }
    })

    ipcMain.handle('products:delete', async (event, id: string) => {
      try {
        await guard(event, 'products:delete')
        await productRepo.delete(id)
        return { success: true }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al eliminar producto' }
      }
    })

    ipcMain.handle('categories:list', async (event) => {
      try {
        await guard(event, 'categories:list')
        const categories = await productRepo.findCategories()
        return { success: true, data: categories }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al listar categorías' }
      }
    })

    ipcMain.handle('categories:create', async (event, name: string, color?: string) => {
      try {
        await guard(event, 'categories:create')
        const category = await productRepo.createCategory(name, color)
        return { success: true, data: category }
      } catch (error: unknown) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          return { success: false, error: 'La categoría ya existe' }
        }
        return { success: false, error: 'Error al crear categoría' }
      }
    })

    ipcMain.handle('categories:update', async (event, id: string, name: string, color?: string) => {
      try {
        await guard(event, 'categories:update')
        const category = await productRepo.updateCategory(id, name, color)
        return { success: true, data: category }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al actualizar categoría' }
      }
    })

    ipcMain.handle('categories:delete', async (event, id: string) => {
      try {
        await guard(event, 'categories:delete')
        await productRepo.deleteCategory(id)
        return { success: true }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al eliminar categoría' }
      }
    })

    // ─── Taxes ─────────────────────────────────────────────
    ipcMain.handle('taxes:list', async (event) => {
      try {
        await guard(event, 'taxes:list')
        const taxes = await productRepo.findAllTaxes()
        return { success: true, data: taxes }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al listar impuestos' }
      }
    })

    ipcMain.handle('taxes:create', async (event, input: { name: string; rate: number; description?: string }) => {
      try {
        await guard(event, 'taxes:create')
        const tax = await productRepo.createTax(input.name, input.rate, input.description)
        return { success: true, data: tax }
      } catch (error: unknown) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          return { success: false, error: 'El impuesto ya existe' }
        }
        return { success: false, error: 'Error al crear impuesto' }
      }
    })

    ipcMain.handle('taxes:update', async (event, id: string, input: { name?: string; rate?: number; description?: string; active?: boolean }) => {
      try {
        await guard(event, 'taxes:update')
        const tax = await productRepo.updateTax(id, input)
        return { success: true, data: tax }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al actualizar impuesto' }
      }
    })
  }

  // ─── Customers ──────────────────────────────────────────
  const customerRepo = deps.customerRepository

  if (customerRepo) {
    ipcMain.handle('customers:list', async (event) => {
      try {
        await guard(event, 'customers:list')
        const customers = await customerRepo.list()
        return { success: true, data: customers }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al listar clientes' }
      }
    })

    ipcMain.handle('customers:search', async (event, query: string) => {
      try {
        await guard(event, 'customers:search')
        const customers = await customerRepo.search(query)
        return { success: true, data: customers }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al buscar clientes' }
      }
    })

    ipcMain.handle('customers:find-by-tax-id', async (event, taxId: string) => {
      try {
        await guard(event, 'customers:find-by-tax-id')
        const customer = await customerRepo.findByTaxId(taxId)
        return { success: true, data: customer }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al buscar cliente' }
      }
    })

    ipcMain.handle('customers:create', async (event, input) => {
      try {
        await guard(event, 'customers:create')
        const customer = await customerRepo.create(input)
        return { success: true, data: customer }
      } catch (error: unknown) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          return { success: false, error: 'El RIF ya existe' }
        }
        return { success: false, error: 'Error al crear cliente' }
      }
    })

    ipcMain.handle('customers:update', async (event, id: string, input) => {
      try {
        await guard(event, 'customers:update')
        const customer = await customerRepo.update(id, input)
        return { success: true, data: customer }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al actualizar cliente' }
      }
    })

    ipcMain.handle('customers:delete', async (event, id: string) => {
      try {
        await guard(event, 'customers:delete')
        await customerRepo.delete(id)
        return { success: true }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al eliminar cliente' }
      }
    })
  }

  // ─── Sales ───────────────────────────────────────────────
  ipcMain.handle('sales:create', async (event, input: {
    items: Array<{ productId: string; quantity: number; priceUsd: number; discount?: number }>
    documentType: string
    payments: Array<{ method: string; amountBs: number; reference?: string }>
    discount?: number
    usdRate?: number
    notes?: string
    userId: string
    customerId?: string
  }) => {
    try {
      const session = await guard(event, 'sales:create')
      const userId = session.userId

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
      const totalBs = totalUsd * rate

      // Validate payments sum equals total (1 Bs tolerance)
      const paymentsSum = input.payments.reduce((sum, p) => sum + p.amountBs, 0)
      if (Math.abs(paymentsSum - totalBs) > 1) {
        return { success: false, error: `Los pagos (Bs. ${paymentsSum.toFixed(2)}) no coinciden con el total (Bs. ${totalBs.toFixed(2)})` }
      }

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
            total: totalBs,
            usdRate: rate,
            notes: input.notes ?? null,
            userId,
            customerId: input.customerId ?? null,
            items: {
              create: saleItemsData
            },
            payments: {
              create: input.payments.map(p => ({
                method: p.method,
                amountBs: p.amountBs,
                reference: p.reference ?? null
              }))
            }
          },
          include: { items: { include: { product: true } }, user: true, payments: true }
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
      if (error instanceof AuthError) return { success: false, error: error.message }
      console.error('sales:create error:', error)
      return { success: false, error: 'Error al crear la venta' }
    }
  })

  const saleRepo = deps.saleRepository

  ipcMain.handle('sales:list', async (event, filters?: SaleFilters) => {
    try {
      await guard(event, 'sales:list')
      if (!saleRepo) return { success: false, error: 'Repositorio de ventas no disponible' }
      const sales = await saleRepo.findAll(filters)
      return { success: true, data: sales }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al listar ventas' }
    }
  })

  ipcMain.handle('sales:cancel', async (event, id: string, userId: string, reason?: string) => {
    try {
      await guard(event, 'sales:cancel')
      if (!saleRepo) return { success: false, error: 'Repositorio de ventas no disponible' }
      const sale = await saleRepo.cancel(id, userId, reason)
      return { success: true, data: sale }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      const msg = error instanceof Error ? error.message : 'Error al anular venta'
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('sales:next-receipt-number', async (event) => {
    try {
      await guard(event, 'sales:next-receipt-number')
      const last = await prisma.sale.findFirst({
        orderBy: { receiptNumber: 'desc' },
        select: { receiptNumber: true }
      })
      const nextNumber = (last?.receiptNumber ?? 0) + 1
      return { success: true, data: nextNumber }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al obtener número de factura' }
    }
  })

  // ─── Cash Register ───────────────────────────────────────
  ipcMain.handle('cash:open', async (event, balance: number) => {
    try {
      await guard(event, 'cash:open')
      const register = await prisma.cashRegister.create({
        data: {
          openingBalance: balance,
          date: new Date(),
          movements: {
            create: {
              type: 'OPENING',
              amount: balance,
              description: 'Apertura de caja',
              userId: '',
              registerId: ''
            }
          }
        }
      })
      return { success: true, data: register }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al abrir caja' }
    }
  })

  ipcMain.handle('cash:close', async (event, registerId: string, closingBalance: number, userId: string) => {
    try {
      await guard(event, 'cash:close')
      const register = await prisma.$transaction(async (tx) => {
        await tx.cashMovement.create({
          data: {
            type: 'CLOSING',
            amount: closingBalance,
            description: 'Cierre de caja',
            userId,
            registerId
          }
        })
        return tx.cashRegister.update({
          where: { id: registerId },
          data: {
            closingBalance,
            closedAt: new Date(),
            closedById: userId
          },
          include: { movements: true }
        })
      })
      return { success: true, data: register }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al cerrar caja' }
    }
  })

  ipcMain.handle('cash:summary', async (event) => {
    try {
      await guard(event, 'cash:summary')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const register = await prisma.cashRegister.findFirst({
        where: { date: { gte: today } },
        include: {
          movements: { include: { user: { select: { fullName: true } } } },
          closedBy: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
      // Also get today's sales with payment entries
      const sales = await prisma.sale.findMany({
        where: { createdAt: { gte: today }, status: 'COMPLETED' },
        include: { payments: true }
      })
      return { success: true, data: { register, sales } }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al obtener resumen' }
    }
  })

  ipcMain.handle('cash:add-movement', async (event, data: {
    registerId: string; type: string; amount: number; description?: string; userId: string
  }) => {
    try {
      await guard(event, 'cash:add-movement')
      const movement = await prisma.cashMovement.create({
        data: {
          type: data.type as never,
          amount: data.amount,
          description: data.description,
          userId: data.userId,
          registerId: data.registerId
        }
      })
      return { success: true, data: movement }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al registrar movimiento' }
    }
  })

  // ─── USD Rate ────────────────────────────────────────────
  ipcMain.handle('usd:rate', async (event) => {
    try {
      await guard(event, 'usd:rate')
      const config = await prisma.appConfig.findUnique({ where: { id: 'default' } })
      return {
        success: true,
        data: {
          rate: config?.usdRate ?? 0,
          source: config?.usdRateSource ?? 'manual',
          rateId: config?.usdRateId ?? null
        }
      }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al obtener tasa USD' }
    }
  })

  ipcMain.handle('usd:history', async (event) => {
    try {
      await guard(event, 'usd:history')
      const rates = await prisma.usdRate.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { createdBy: { select: { fullName: true } } }
      })
      return {
        success: true,
        data: rates.map((r) => ({
          id: r.id,
          rate: r.rate,
          source: r.source,
          notes: r.notes,
          createdBy: r.createdBy?.fullName ?? null,
          createdAt: r.createdAt.toISOString()
        }))
      }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al obtener historial de tasas' }
    }
  })

  // ─── Config ──────────────────────────────────────────────
  ipcMain.handle('config:get', async (event) => {
    try {
      await guard(event, 'config:get')
      const config = await prisma.appConfig.findUnique({ where: { id: 'default' } })
      return { success: true, data: config }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al obtener configuración' }
    }
  })

  ipcMain.handle('config:update', async (event, data: Record<string, unknown>) => {
    try {
      const session = await guard(event, 'config:update')
      const config = await prisma.appConfig.update({
        where: { id: 'default' },
        data: data as never
      })
      if (data.usdRate !== undefined) {
        const rate = await prisma.usdRate.create({
          data: {
            rate: data.usdRate as number,
            source: (data.usdRateSource as string) ?? config.usdRateSource,
            createdById: session.userId,
          }
        })
        await prisma.appConfig.update({
          where: { id: 'default' },
          data: { usdRateId: rate.id }
        })
      }
      return { success: true, data: config }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al actualizar configuración' }
    }
  })

  // ─── Company Config ───────────────────────────────────────
  ipcMain.handle('company:get', async (event) => {
    try {
      await guard(event, 'company:get')
      let config = await prisma.companyConfig.findUnique({ where: { id: 'default' } })
      if (!config) {
        config = await prisma.companyConfig.create({
          data: { id: 'default', businessName: '' }
        })
      }
      return { success: true, data: config }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al obtener datos de la empresa' }
    }
  })

  ipcMain.handle('company:update', async (event, data: Record<string, unknown>) => {
    try {
      await guard(event, 'company:update')
      const config = await prisma.companyConfig.upsert({
        where: { id: 'default' },
        create: { id: 'default', businessName: (data.businessName as string) ?? '', ...data },
        update: data as never
      })
      return { success: true, data: config }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al actualizar datos de la empresa' }
    }
  })

  // ─── Reports ──────────────────────────────────────────────
  ipcMain.handle('reports:daily', async (event, date?: string) => {
    try {
      await guard(event, 'reports:daily')
      const d = date ? new Date(date) : new Date()
      d.setHours(0, 0, 0, 0)
      const next = new Date(d); next.setDate(next.getDate() + 1)

      const sales = await prisma.sale.findMany({
        where: { createdAt: { gte: d, lt: next }, status: 'COMPLETED' },
        include: { payments: true, user: { select: { fullName: true } } }
      })

      const byMethod = sales.reduce((acc, s) => {
        for (const p of s.payments) {
          acc[p.method] = (acc[p.method] ?? 0) + p.amountBs
        }
        acc.count = (acc.count ?? 0) + 1
        return acc
      }, {} as Record<string, number>)

      const total = sales.reduce((sum, s) => sum + s.total, 0)

      return { success: true, data: { date: d.toISOString(), sales: sales.length, total, byMethod } }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al generar reporte diario' }
    }
  })

  ipcMain.handle('reports:by-product', async (event) => {
    try {
      await guard(event, 'reports:by-product')
      const items = await prisma.saleItem.findMany({
        where: { sale: { status: 'COMPLETED' } },
        include: { product: { select: { name: true } } }
      })

      const byProduct = items.reduce((acc, i) => {
        const name = i.product.name
        if (!acc[name]) acc[name] = { quantity: 0, total: 0 }
        acc[name].quantity += i.quantity
        acc[name].total += i.total
        return acc
      }, {} as Record<string, { quantity: number; total: number }>)

      return { success: true, data: Object.entries(byProduct)
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 20)
      }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al generar reporte por producto' }
    }
  })

  ipcMain.handle('reports:by-user', async (event) => {
    try {
      await guard(event, 'reports:by-user')
      const sales = await prisma.sale.findMany({
        where: { status: 'COMPLETED' },
        include: { user: { select: { fullName: true } } }
      })

      const byUser = sales.reduce((acc, s) => {
        const name = s.user.fullName
        if (!acc[name]) acc[name] = { sales: 0, total: 0 }
        acc[name].sales += 1
        acc[name].total += s.total
        return acc
      }, {} as Record<string, { sales: number; total: number }>)

      return { success: true, data: Object.entries(byUser)
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.total - a.total)
      }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al generar reporte por usuario' }
    }
  })

  ipcMain.handle('reports:iva', async (event, yearMonth?: string) => {
    try {
      await guard(event, 'reports:iva')
      const now = new Date()
      const [y, m] = yearMonth ? yearMonth.split('-').map(Number) : [now.getFullYear(), now.getMonth()]
      const start = new Date(y, m - 1, 1)
      const end = new Date(y, m, 1)

      const sales = await prisma.sale.findMany({
        where: { createdAt: { gte: start, lt: end }, status: 'COMPLETED', documentType: 'FACTURA' },
        include: { customer: { select: { name: true, taxId: true } } }
      })

      const entries = sales.map(s => ({
        date: s.createdAt.toISOString(),
        receiptNumber: s.receiptNumber,
        customerName: s.customer?.name ?? 'Consumidor Final',
        customerTaxId: s.customer?.taxId ?? '',
        subtotal: s.subtotal,
        taxTotal: s.taxTotal,
        total: s.total,
        discount: s.discount
      }))

      const totals = {
        subtotal: entries.reduce((s, e) => s + e.subtotal, 0),
        taxTotal: entries.reduce((s, e) => s + e.taxTotal, 0),
        total: entries.reduce((s, e) => s + e.total, 0),
        discount: entries.reduce((s, e) => s + e.discount, 0)
      }

      return { success: true, data: { period: yearMonth ?? `${y}-${String(m).padStart(2, '0')}`, entries, totals } }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al generar libro IVA' }
    }
  })

  // ─── Printer ─────────────────────────────────────────────
  ipcMain.handle('printer:test', async (event) => {
    try {
      await guard(event, 'printer:test')
      return { success: false, error: 'Not implemented' }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Not implemented' }
    }
  })

  ipcMain.handle('printer:print-receipt', async (event, data) => {
    try {
      await guard(event, 'printer:print-receipt')
      return { success: false, error: 'Not implemented' }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Not implemented' }
    }
  })

  // ─── Fiscal ───────────────────────────────────────────────
  ipcMain.handle('fiscal:get', async (event) => {
    try {
      await guard(event, 'fiscal:get')
      let config = await prisma.fiscalConfig.findUnique({ where: { id: 'default' } })
      if (!config) {
        config = await prisma.fiscalConfig.create({
          data: { id: 'default', printerType: 'bixolon', printerPort: 'COM1' }
        })
      }
      return { success: true, data: config }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al obtener configuracion fiscal' }
    }
  })

  ipcMain.handle('fiscal:update', async (event, data: Record<string, unknown>) => {
    try {
      await guard(event, 'fiscal:update')
      const config = await prisma.fiscalConfig.upsert({
        where: { id: 'default' },
        create: { id: 'default', printerType: 'bixolon', printerPort: 'COM1', ...data },
        update: data as never
      })
      return { success: true, data: config }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al actualizar configuracion fiscal' }
    }
  })

  // ─── Users ────────────────────────────────────────────────
  const userRepo = deps.userRepository

  if (userRepo) {
    ipcMain.handle('users:list', async (event) => {
      try {
        await guard(event, 'users:list')
        const users = await userRepo.list()
        return { success: true, data: users }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al listar usuarios' }
      }
    })

    ipcMain.handle('users:create', async (event, input: {
      username: string
      password: string
      fullName: string
      roleId: string
    }) => {
      try {
        await guard(event, 'users:create')
        const pwError = validatePassword(input.password)
        if (pwError) return { success: false, error: pwError }
        const user = await userRepo.create(input)
        return { success: true, data: user }
      } catch (error: unknown) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          return { success: false, error: 'El nombre de usuario ya existe' }
        }
        return { success: false, error: 'Error al crear usuario' }
      }
    })

    ipcMain.handle('users:update', async (event, id: string, input: {
      fullName?: string
      roleId?: string
      password?: string
    }) => {
      try {
        await guard(event, 'users:update')
        if (input.password) {
          const pwError = validatePassword(input.password)
          if (pwError) return { success: false, error: pwError }
        }
        const user = await userRepo.update(id, input)
        return { success: true, data: user }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al actualizar usuario' }
      }
    })

    ipcMain.handle('users:toggle-active', async (event, id: string) => {
      try {
        await guard(event, 'users:toggle-active')
        const user = await userRepo.toggleActive(id)
        return { success: true, data: user }
      } catch (error) {
        if (error instanceof AuthError) return { success: false, error: error.message }
        return { success: false, error: 'Error al cambiar estado del usuario' }
      }
    })
  }

  // ─── Plugins ─────────────────────────────────────────────
  ipcMain.handle('plugins:list', async (event) => {
    try {
      await guard(event, 'plugins:list')
      const plugins = await deps.pluginLoader.listPlugins()
      return { success: true, data: plugins }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al listar plugins' }
    }
  })

  ipcMain.handle('plugins:install', async (event, source: string) => {
    try {
      await guard(event, 'plugins:install')
      const result = await deps.pluginLoader.installPlugin(source)
      return result
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al instalar plugin' }
    }
  })

  ipcMain.handle('plugins:toggle-active', async (event, id: string) => {
    try {
      await guard(event, 'plugins:toggle-active')
      const result = await deps.pluginLoader.togglePlugin(id)
      return result
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al cambiar estado del plugin' }
    }
  })

  // ─── Roles ─────────────────────────────────────────────────
  ipcMain.handle('roles:list', async (event) => {
    try {
      await guard(event, 'roles:list')
      const roles = await prisma.role.findMany({
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { users: true } }
        },
        orderBy: { createdAt: 'asc' }
      })
      const data = roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        editable: r.editable,
        permissions: r.permissions.map((rp) => rp.permission.handler),
        userCount: r._count.users,
        createdAt: r.createdAt.toISOString()
      }))
      return { success: true, data }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al listar roles' }
    }
  })

  ipcMain.handle('roles:create', async (event, input: {
    name: string; description?: string; permissions: string[]
  }) => {
    try {
      await guard(event, 'roles:create')
      const existing = await prisma.role.findUnique({ where: { name: input.name } })
      if (existing) return { success: false, error: 'Ya existe un rol con ese nombre' }

      const permissionIds = await prisma.permission.findMany({
        where: { handler: { in: input.permissions } },
        select: { id: true }
      })

      const role = await prisma.role.create({
        data: {
          name: input.name,
          description: input.description,
          permissions: {
            create: permissionIds.map((p) => ({ permissionId: p.id }))
          }
        },
        include: { permissions: { include: { permission: true } } }
      })

      invalidatePermissionCache()

      return {
        success: true,
        data: {
          id: role.id,
          name: role.name,
          description: role.description,
          editable: role.editable,
          permissions: role.permissions.map((rp) => rp.permission.handler)
        }
      }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al crear rol' }
    }
  })

  ipcMain.handle('roles:update', async (event, id: string, input: {
    name?: string; description?: string; permissions?: string[]
  }) => {
    try {
      await guard(event, 'roles:update')
      const role = await prisma.role.findUnique({ where: { id } })
      if (!role) return { success: false, error: 'Rol no encontrado' }
      if (!role.editable) return { success: false, error: 'Este rol no se puede modificar' }

      if (input.name && input.name !== role.name) {
        const existing = await prisma.role.findUnique({ where: { name: input.name } })
        if (existing) return { success: false, error: 'Ya existe un rol con ese nombre' }
      }

      if (input.permissions) {
        await prisma.rolePermission.deleteMany({ where: { roleId: id } })
        const permissionIds = await prisma.permission.findMany({
          where: { handler: { in: input.permissions } },
          select: { id: true }
        })
        await prisma.rolePermission.createMany({
          data: permissionIds.map((p) => ({ roleId: id, permissionId: p.id }))
        })
      }

      const updated = await prisma.role.update({
        where: { id },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {})
        },
        include: { permissions: { include: { permission: true } } }
      })

      invalidatePermissionCache()

      return {
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          description: updated.description,
          editable: updated.editable,
          permissions: updated.permissions.map((rp) => rp.permission.handler)
        }
      }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al actualizar rol' }
    }
  })

  ipcMain.handle('roles:delete', async (event, id: string) => {
    try {
      await guard(event, 'roles:delete')
      const role = await prisma.role.findUnique({
        where: { id },
        include: { _count: { select: { users: true } } }
      })
      if (!role) return { success: false, error: 'Rol no encontrado' }
      if (!role.editable) return { success: false, error: 'Este rol no se puede eliminar' }
      if (role._count.users > 0) return { success: false, error: 'No se puede eliminar: hay usuarios con este rol' }

      await prisma.role.delete({ where: { id } })
      invalidatePermissionCache()
      return { success: true }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al eliminar rol' }
    }
  })

  // Permissions list — read-only, for role editing UI
  ipcMain.handle('permissions:list', async (event) => {
    try {
      await guard(event, 'permissions:list')
      const permissions = await prisma.permission.findMany({ orderBy: { category: 'asc' } })
      return { success: true, data: permissions.map((p) => ({
        id: p.id,
        handler: p.handler,
        description: p.description,
        category: p.category
      })) }
    } catch (error) {
      if (error instanceof AuthError) return { success: false, error: error.message }
      return { success: false, error: 'Error al listar permisos' }
    }
  })
}
