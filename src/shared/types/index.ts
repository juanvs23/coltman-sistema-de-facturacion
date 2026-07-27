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
  taxId: string    // RIF (VE), NIT (CO), RFC (MX), RUC (EC)
  name: string
  personType: string   // V, E, J, G, P
  personSubtype: string // contribuyente, no_contribuyente, especial, etc.
  legalType?: string   // CA, SRL, SC (solo jurídicas)
  address?: string
  phone?: string
  email?: string
  active: boolean
}

// Helpers para tipos de persona
export const PERSON_TYPES: Array<{ value: string; label: string; subtypes: Array<{ value: string; label: string }> }> = [
  { value: 'V', label: 'Natural Venezolano', subtypes: [
    { value: 'contribuyente', label: 'Contribuyente ordinario' },
    { value: 'no_contribuyente', label: 'No contribuyente' },
    { value: 'especial', label: 'Sujeto pasivo especial' },
    { value: 'independiente', label: 'Trabajador independiente' },
    { value: 'dependiente', label: 'Empleado / Dependiente' }
  ]},
  { value: 'E', label: 'Natural Extranjero', subtypes: [
    { value: 'contribuyente', label: 'Contribuyente ordinario' },
    { value: 'no_contribuyente', label: 'No contribuyente' },
    { value: 'independiente', label: 'Trabajador independiente' }
  ]},
  { value: 'J', label: 'Jurídico', subtypes: [
    { value: 'contribuyente', label: 'Contribuyente ordinario' },
    { value: 'especial', label: 'Sujeto pasivo especial' },
    { value: 'no_contribuyente', label: 'No contribuyente' }
  ]},
  { value: 'G', label: 'Gobierno', subtypes: [
    { value: 'gobierno', label: 'Ente gubernamental' }
  ]},
  { value: 'P', label: 'Pasaporte', subtypes: [
    { value: 'no_contribuyente', label: 'No contribuyente' }
  ]}
]

export function getPersonSubtypes(personType: string): Array<{ value: string; label: string }> {
  return PERSON_TYPES.find(pt => pt.value === personType)?.subtypes ?? []
}

export const LEGAL_TYPES: Array<{ value: string; label: string }> = [
  { value: 'CA', label: 'Compañía Anónima (C.A.)' },
  { value: 'SRL', label: 'S.R.L.' },
  { value: 'SC', label: 'Sociedad Civil' },
  { value: 'FUNDACION', label: 'Fundación' },
  { value: 'ASOCIACION', label: 'Asociación Civil' },
  { value: 'OTRO', label: 'Otro' }
]

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

export type DocumentType = 'FACTURA' | 'TICKET' | 'PRESUPUESTO'
export type QuotationStatusType = 'DRAFT' | 'SENT' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED'

export interface PaymentEntry {
  id: string
  method: string
  amountBs: number
  reference?: string
  bank?: string
}

export interface PaymentInput {
  method: string
  amountBs: number
  reference?: string
  bank?: string
}

// Bancos de Venezuela (ordenados por uso)
export const VE_BANKS: Array<{ id: string; label: string }> = [
  { id: 'BANESCO', label: 'Banesco' },
  { id: 'MERCANTIL', label: 'Mercantil' },
  { id: 'PROVINCIAL', label: 'BBVA Provincial' },
  { id: 'VENEZUELA', label: 'Banco de Venezuela' },
  { id: 'NACIONAL_CREDITO', label: 'Banco Nacional de Crédito' },
  { id: 'EXTERIOR', label: 'Banco Exterior' },
  { id: 'BOD', label: 'BOD' },
  { id: 'BANCARIBE', label: 'Bancaribe' },
  { id: 'BANCO_MICROFINANCIERO', label: 'Banco Microfinanciero' },
  { id: 'SOFITASA', label: 'Sofitasa' },
  { id: 'BANPLUS', label: 'Banplus' },
  { id: 'BANCRECER', label: 'Bancrecer' },
  { id: '100_BANCO', label: '100% Banco' },
  { id: 'DEL_SUR', label: 'Banco del Sur' },
  { id: 'BANCO_AMIGO', label: 'Banco Amigo' },
  { id: 'MIA', label: 'Mia Banco Digital' },
  { id: 'OMNIROUTE', label: 'Omniroute' },
  { id: 'OTRO', label: 'Otro' },
]

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

// ─── Quotation Types ──────────────────────────────────────────

export interface QuotationItemData {
  id: string
  quantity: number
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

export interface QuotationData {
  id: string
  number: number
  status: QuotationStatusType
  validUntil: string
  subtotal: number
  taxTotal: number
  discount: number
  total: number
  usdRate?: number
  notes?: string
  userId: string
  user?: User
  customerId?: string
  customer?: Customer
  items: QuotationItemData[]
  convertedToSaleId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateQuotationRequest {
  items: Array<{
    productId: string
    quantity: number
    priceUsd: number
    discount?: number
  }>
  discount?: number
  usdRate?: number
  notes?: string
  userId: string
  customerId?: string
}

export interface QuotationFilters {
  from?: string
  to?: string
  status?: QuotationStatusType
  customerId?: string
  limit?: number
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
  motivo?: string
  customerNotes?: string
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

// ─── Shift Config Types ───────────────────────────────────────

export interface ShiftConfigData {
  id: string
  name: string
  days: string   // JSON array "[1,2,3,4,5]"
  startTime: string
  endTime: string
  order: number
  active: boolean
  createdAt: string
  updatedAt: string
}

const DAY_LABELS: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mie', 4: 'Jue', 5: 'Vie', 6: 'Sab', 7: 'Dom' }

export function parseShiftDays(daysJson: string): number[] {
  try { return JSON.parse(daysJson) as number[] } catch { return [] }
}

export function formatShiftDays(days: number[]): string {
  return days.map(d => DAY_LABELS[d] ?? `?`).join(', ')
}

// ─── Quotation IPC Types ──────────────────────────────────────

export interface QuotationIpcContract {
  'quotation:create': { request: CreateQuotationRequest; response: QuotationData }
  'quotation:list': { request: QuotationFilters | void; response: QuotationData[] }
  'quotation:get': { request: string; response: QuotationData }
  'quotation:convert-to-sale': { request: string; response: Sale }
  'quotation:cancel': { request: string; response: QuotationData }
}

/** Kernel IPC contract — exposed to renderer via preload */
export interface KernelIpcContract {
  'ui-registry:subscribe': { channel: 'ui-registry:updated'; response: UiRegistryState }
  'ui-registry:get-state': { request: void; response: UiRegistryState }
  'kernel:get-country-plugin': { request: void; response: CountryPluginData | null }
  'kernel:get-country-config': { request: void; response: { country: string } }
}

/** Country plugin data returned from kernel IPC */
export interface FiscalAuthorityData {
  name: string
  description: string
  electronicInvoiceLabel: string
  electronicInvoiceDescription: string
  autoSendLabel: string
  autoSendDescription: string
}

export interface CountryPluginData {
  countryCode: string
  countryName: string
  currencySymbol: string
  currencyCode: string
  taxIdLabel: string
  paymentMethods: Array<{ id: string; label: string }>
  defaultTaxes: Array<{ name: string; rate: number; description?: string }>
  defaultExchangeRate: number | null
  fiscalAuthority?: FiscalAuthorityData
  personTypes?: Array<{ value: string; label: string; subtypes: Array<{ value: string; label: string }> }>
}
