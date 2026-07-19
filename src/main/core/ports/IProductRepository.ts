import type { Product, Category, Tax } from '@shared/types'

export interface CreateProductInput {
  code: string
  name: string
  description?: string
  type: 'PRODUCT' | 'SERVICE' | 'COMBO'
  priceUsd: number
  cost?: number
  stock: number
  image?: string
  categoryId?: string
  taxIds?: string[]  // IDs de impuestos aplicables
}

export interface UpdateProductInput {
  code?: string
  name?: string
  description?: string
  type?: 'PRODUCT' | 'SERVICE' | 'COMBO'
  priceUsd?: number
  cost?: number
  stock?: number
  image?: string
  active?: boolean
  categoryId?: string
  taxIds?: string[]
}

export interface IProductRepository {
  findAll(activeOnly?: boolean): Promise<Product[]>
  findById(id: string): Promise<Product | null>
  findByCode(code: string): Promise<Product | null>
  search(query: string): Promise<Product[]>
  create(input: CreateProductInput): Promise<Product>
  update(id: string, input: UpdateProductInput): Promise<Product>
  delete(id: string): Promise<void>
  updateStock(id: string, quantity: number): Promise<void>

  // Categories
  findCategories(): Promise<Category[]>
  createCategory(name: string, color?: string): Promise<Category>
  updateCategory(id: string, name: string, color?: string): Promise<Category>
  deleteCategory(id: string): Promise<void>

  // Taxes
  findAllTaxes(): Promise<Tax[]>
  findActiveTaxes(): Promise<Tax[]>
  createTax(name: string, rate: number, description?: string): Promise<Tax>
  updateTax(id: string, data: { name?: string; rate?: number; description?: string; active?: boolean }): Promise<Tax>
  getProductTaxes(productId: string): Promise<Tax[]>
  setProductTaxes(productId: string, taxIds: string[]): Promise<void>
}
