// ─── Domain Types ────────────────────────────────────────────

export interface User {
  id: string
  username: string
  fullName: string
  role: 'SELLER' | 'ADMIN' | 'SUPERADMIN'
  active: boolean
}

export interface AuthSession {
  userId: string
  username: string
  fullName: string
  role: 'SELLER' | 'ADMIN' | 'SUPERADMIN'
  loggedAt: string
}

export interface Product {
  id: string
  code: string
  name: string
  description?: string
  type: 'PRODUCT' | 'SERVICE' | 'COMBO'
  price: number
  priceUsd?: number
  stock: number
  taxRate: number
  categoryId?: string
  category?: Category
}

export interface Category {
  id: string
  name: string
  color?: string
}

export interface SaleItem {
  id: string
  quantity: number
  price: number
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  productId: string
  product?: Product
}

export interface Sale {
  id: string
  receiptNumber: number
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
  subtotal: number
  taxTotal: number
  discount: number
  total: number
  paymentMethod: 'CASH' | 'TRANSFER' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'DIVISA' | 'MIXED'
  usdRate?: number
  userId: string
  user?: User
  items: SaleItem[]
  createdAt: string
}

// ─── IPC Channel Types ───────────────────────────────────────

export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface CreateSaleRequest {
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  paymentMethod: Sale['paymentMethod']
  cashAmount?: number
  usdRate?: number
  notes?: string
}

// ─── USD Rate ────────────────────────────────────────────────

export interface UsdRate {
  rate: number
  source: 'bcv' | 'enparalelo' | 'criptodolar' | 'manual'
  updatedAt: string
}
