import type { Sale } from '@shared/types'

export interface ISaleRepository {
  findById(id: string): Promise<Sale | null>
  findByReceiptNumber(receiptNumber: number): Promise<Sale | null>
  findAll(from?: Date, to?: Date): Promise<Sale[]>
  create(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale>
  cancel(id: string, userId: string): Promise<Sale>
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
