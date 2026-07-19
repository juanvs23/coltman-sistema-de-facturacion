import { prisma } from './prisma'
import type { Sale } from '@shared/types'
import type { ISaleRepository, SaleFilters } from '../../core/ports/ISaleRepository'

export class PrismaSaleRepository implements ISaleRepository {
  async findById(id: string): Promise<Sale | null> {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: true,
        customer: true
      }
    }) as unknown as Sale | null
  }

  async findByReceiptNumber(receiptNumber: number): Promise<Sale | null> {
    return prisma.sale.findUnique({
      where: { receiptNumber },
      include: {
        items: { include: { product: true } },
        user: true,
        customer: true
      }
    }) as unknown as Sale | null
  }

  async findAll(filters: SaleFilters = {}): Promise<Sale[]> {
    const where: Record<string, unknown> = {}

    if (filters.from || filters.to) {
      where.createdAt = {}
      if (filters.from) (where.createdAt as Record<string, Date>).gte = filters.from
      if (filters.to) (where.createdAt as Record<string, Date>).lte = filters.to
    }
    if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod
    if (filters.userId) where.userId = filters.userId
    if (filters.customerId) where.customerId = filters.customerId
    if (filters.documentType) where.documentType = filters.documentType
    if (filters.status) where.status = filters.status

    return prisma.sale.findMany({
      where: where as never,
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, username: true, fullName: true } },
        customer: { select: { id: true, taxId: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 100
    }) as unknown as Sale[]
  }

  async create(): Promise<Sale> {
    throw new Error('Use sales:create IPC handler directly')
  }

  async cancel(id: string, userId: string, reason?: string): Promise<Sale> {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true }
    })
    if (!sale) throw new Error('Venta no encontrada')
    if (sale.status === 'CANCELLED') throw new Error('La venta ya está anulada')

    // Restore stock and cancel in a transaction
    return prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (product && product.type === 'PRODUCT') {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          })
        }
      }

      const cancelled = await tx.sale.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledById: userId,
          notes: reason ? (sale.notes ? `${sale.notes} | Anulación: ${reason}` : `Anulación: ${reason}`) : sale.notes
        },
        include: {
          items: { include: { product: true } },
          user: true,
          customer: true
        }
      })

      return cancelled as unknown as Sale
    })
  }

  async getNextReceiptNumber(): Promise<number> {
    const last = await prisma.sale.findFirst({
      orderBy: { receiptNumber: 'desc' },
      select: { receiptNumber: true }
    })
    return (last?.receiptNumber ?? 0) + 1
  }

  async getDailySummary(): Promise<never> {
    throw new Error('Not implemented: getDailySummary')
  }
}
