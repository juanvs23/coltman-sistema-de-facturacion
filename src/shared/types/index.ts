// ─── Domain Types ────────────────────────────────────────────

export interface User {
  id: string
  username: string
  fullName: string
  role: string
  roleId: string
  active: boolean
}

export interface AuthSession {
  userId: string
  username: string
  fullName: string
  role: string
  roleId: string
  sessionToken: string
  loggedAt: string
}

export interface Product {
  id: string
  code: string
  name: string
  description?: string
  type: 'PRODUCT' | 'SERVICE' | 'COMBO'
  price: number       // Precio calculado en moneda local (priceUsd * tasa)
  priceUsd: number     // Precio en USD (valor primario)
  cost?: number
  stock: number
  image?: string      // Ruta de imagen
  active: boolean
  categoryId?: string
  category?: Category
  taxes?: ProductTax[] // Impuestos aplicables
  createdAt?: string
  updatedAt?: string
}

export interface ProductTax {
  productId: string
  taxId: string
  tax?: Tax
}

export interface Tax {
  id: string
  name: string
  rate: number
  description?: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Customer {
  id: string
  taxId: string  // RIF (VE), NIT (CO), RFC (MX), RUC (EC)
  name: string
  address?: string
  phone?: string
  email?: string
  active: boolean
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
  priceUsd?: number
  discount: number
  subtotal: number
  taxRate: number
  taxAmount: number
  taxBreakdown?: string
  total: number
  productId: string
  product?: Product
}

export type DocumentType = 'FACTURA' | 'TICKET'

export interface PaymentEntry {
  id: string
  method: string
  amountBs: number
  reference?: string
}

export interface PaymentInput {
  method: string
  amountBs: number
  reference?: string
}

export interface Sale {
  id: string
  receiptNumber: number
  documentType: DocumentType
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
  subtotal: number
  taxTotal: number
  discount: number
  total: number
  payments: PaymentEntry[]
  usdRate?: number
  notes?: string
  userId: string
  user?: User
  customerId?: string
  customer?: Customer
  items: SaleItem[]
  createdAt: string
  cancelledAt?: string
  cancelledById?: string
  cancelledBy?: User
}

export interface SaleFilters {
  from?: string
  to?: string
  paymentMethod?: string
  userId?: string
  customerId?: string
  documentType?: string
  status?: string
  limit?: number
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
    priceUsd: number
    discount?: number
  }>
  documentType: DocumentType
  payments: PaymentInput[]
  discount?: number
  usdRate?: number
  notes?: string
  userId: string
  customerId?: string
}

// ─── Company Configuration ───────────────────────────────────

export interface CompanyConfig {
  businessName: string
  taxId?: string
  address?: string
  phone?: string
  email?: string
  logo?: string
}

// ─── USD Rate ────────────────────────────────────────────────

export interface UsdRate {
  rate: number
  source: 'bcv' | 'enparalelo' | 'criptodolar' | 'manual'
  updatedAt: string
}

// ─── Kernel IPC Bridge Types ─────────────────────────────────

/** State of the UI registry sent to the renderer via IPC */
export interface UiRegistryState {
  menuItems: Array<{ id: string; label: string; icon: string; route: string; permission?: string }>
  routes: Array<{ path: string; component: string; permission?: string }>
  settingsTabs: Array<{ id: string; label: string; component: string }>
}

/** Hook definition for IPC bridge */
export interface PluginHookDef {
  event: string
  type: 'action' | 'filter'
  description?: string
}

/** Kernel IPC contract — exposed to renderer via preload */
export interface KernelIpcContract {
  'ui-registry:subscribe': { channel: 'ui-registry:updated'; response: UiRegistryState }
  'ui-registry:get-state': { request: void; response: UiRegistryState }
  'kernel:get-country-plugin': { request: void; response: CountryPluginData | null }
  'kernel:get-country-config': { request: void; response: { country: string } }
}

/** Country plugin data returned from kernel IPC */
export interface CountryPluginData {
  countryCode: string
  countryName: string
  currencySymbol: string
  currencyCode: string
  taxIdLabel: string
  paymentMethods: Array<{ id: string; label: string }>
  defaultTaxes: Array<{ name: string; rate: number; description?: string }>
  defaultExchangeRate: number | null
}
