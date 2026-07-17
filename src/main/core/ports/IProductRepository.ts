import type { Product, Category } from '@shared/types'

export interface IProductRepository {
  findAll(activeOnly?: boolean): Promise<Product[]>
  findById(id: string): Promise<Product | null>
  findByCode(code: string): Promise<Product | null>
  search(query: string): Promise<Product[]>
  create(product: Omit<Product, 'id' | 'category'> & { categoryId?: string }): Promise<Product>
  update(id: string, product: Partial<Product>): Promise<Product>
  delete(id: string): Promise<void>
  updateStock(id: string, quantity: number): Promise<void>

  // Categories
  findCategories(): Promise<Category[]>
  createCategory(name: string, color?: string): Promise<Category>
}
