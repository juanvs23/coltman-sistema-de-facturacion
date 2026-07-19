import type { Sale } from '@shared/types'

export interface SaleFilters {
  from?: Date
  to?: Date
  paymentMethod?: string
  userId?: string
  customerId?: string
  documentType?: string
  status?: string
  limit?: number
}

export interface ISaleRepository {
  findById(id: string): Promise<Sale | null>
  findByReceiptNumber(receiptNumber: number): Promise<Sale | null>
  findAll(filters?: SaleFilters): Promise<Sale[]>
  create(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale>
  cancel(id: string, userId: string, reason?: string): Promise<Sale>
  getNextReceiptNumber(): Promise<number>
  getDailySummary(date: Date): Promise<DailySummary>
}

export interface DailySummary {
  date: Date
  totalSales: number
  totalAmount: number
  totalTax: number
  paymentMethods: Record<string, number>
}
