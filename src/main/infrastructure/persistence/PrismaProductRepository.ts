import { prisma } from './prisma'
import type { Product, Category, Tax } from '@shared/types'
import type { IProductRepository, CreateProductInput, UpdateProductInput } from '../../core/ports/IProductRepository'

async function getUsdRate(): Promise<number> {
  const config = await prisma.appConfig.findUnique({ where: { id: 'default' } })
  return config?.usdRate ?? 0
}

export class PrismaProductRepository implements IProductRepository {
  private async findAllProducts(where: Record<string, unknown> = {}): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: where as never,
      include: { category: true, taxes: { include: { tax: true } } },
      orderBy: { code: 'asc' }
    })
    return products as unknown as Product[]
  }

  private async findOneProduct(where: Record<string, unknown>): Promise<Product | null> {
    const product = await prisma.product.findFirst({
      where: where as never,
      include: { category: true, taxes: { include: { tax: true } } }
    })
    return product as unknown as Product | null
  }

  async findAll(activeOnly = true): Promise<Product[]> {
    return this.findAllProducts(activeOnly ? { active: true } : {})
  }

  async findById(id: string): Promise<Product | null> {
    return this.findOneProduct({ id })
  }

  async findByCode(code: string): Promise<Product | null> {
    return this.findOneProduct({ code })
  }

  async search(query: string): Promise<Product[]> {
    return this.findAllProducts({
      active: true,
      OR: [
        { name: { contains: query } },
        { code: { contains: query } }
      ]
    })
  }

  async create(input: CreateProductInput): Promise<Product> {
    const rate = await getUsdRate()
    const product = await prisma.product.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        type: input.type,
        priceUsd: input.priceUsd,
        price: input.priceUsd * rate,
        cost: input.cost,
        stock: input.stock,
        image: input.image,
        categoryId: input.categoryId ?? null
      },
      include: { category: true, taxes: { include: { tax: true } } }
    })

    // Associate taxes
    if (input.taxIds && input.taxIds.length > 0) {
      for (const taxId of input.taxIds) {
        await prisma.productTax.create({ data: { productId: product.id, taxId } })
      }
    }

    return prisma.product.findUnique({
      where: { id: product.id },
      include: { category: true, taxes: { include: { tax: true } } }
    }) as unknown as Promise<Product>
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const data: Record<string, unknown> = {}
    if (input.code !== undefined) data.code = input.code
    if (input.name !== undefined) data.name = input.name
    if (input.description !== undefined) data.description = input.description
    if (input.type !== undefined) data.type = input.type
    if (input.cost !== undefined) data.cost = input.cost
    if (input.stock !== undefined) data.stock = input.stock
    if (input.image !== undefined) data.image = input.image
    if (input.active !== undefined) data.active = input.active
    if (input.categoryId !== undefined) data.categoryId = input.categoryId

    if (input.priceUsd !== undefined) {
      data.priceUsd = input.priceUsd
      const rate = await getUsdRate()
      data.price = input.priceUsd * rate
    }

    const product = await prisma.product.update({
      where: { id },
      data: data as never,
      include: { category: true, taxes: { include: { tax: true } } }
    })

    // Update tax associations if provided
    if (input.taxIds !== undefined) {
      await prisma.productTax.deleteMany({ where: { productId: id } })
      for (const taxId of input.taxIds) {
        await prisma.productTax.create({ data: { productId: id, taxId } })
      }
    }

    return prisma.product.findUnique({
      where: { id },
      include: { category: true, taxes: { include: { tax: true } } }
    }) as unknown as Promise<Product>
  }

  async delete(id: string): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { active: false }
    })
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { stock: { increment: quantity } }
    })
  }

  // ── Categories ─────────────────────────────────────────────

  async findCategories(): Promise<Category[]> {
    return prisma.category.findMany({ orderBy: { name: 'asc' } }) as unknown as Category[]
  }

  async createCategory(name: string, color?: string): Promise<Category> {
    return prisma.category.create({ data: { name, color } }) as unknown as Category
  }

  async updateCategory(id: string, name: string, color?: string): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data: { name, color }
    }) as unknown as Category
  }

  async deleteCategory(id: string): Promise<void> {
    // Reassign products to no category before deleting
    await prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
    await prisma.category.delete({ where: { id } })
  }

  // ── Taxes ──────────────────────────────────────────────────

  async findAllTaxes(): Promise<Tax[]> {
    return prisma.tax.findMany({ orderBy: { name: 'asc' } }) as unknown as Tax[]
  }

  async findActiveTaxes(): Promise<Tax[]> {
    return prisma.tax.findMany({ where: { active: true }, orderBy: { name: 'asc' } }) as unknown as Tax[]
  }

  async createTax(name: string, rate: number, description?: string): Promise<Tax> {
    return prisma.tax.create({ data: { name, rate, description } }) as unknown as Tax
  }

  async updateTax(id: string, data: { name?: string; rate?: number; description?: string; active?: boolean }): Promise<Tax> {
    return prisma.tax.update({ where: { id }, data }) as unknown as Tax
  }

  async getProductTaxes(productId: string): Promise<Tax[]> {
    const pts = await prisma.productTax.findMany({
      where: { productId },
      include: { tax: true }
    })
    return pts.map(pt => pt.tax) as unknown as Tax[]
  }

  async setProductTaxes(productId: string, taxIds: string[]): Promise<void> {
    await prisma.productTax.deleteMany({ where: { productId } })
    for (const taxId of taxIds) {
      await prisma.productTax.create({ data: { productId, taxId } })
    }
  }
}
