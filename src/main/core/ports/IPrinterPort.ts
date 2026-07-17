/**
 * Puerto para impresora fiscal.
 * Define el contrato que cualquier impresora debe implementar.
 */
export interface IPrinterPort {
  /** Inicializa la conexión con la impresora */
  connect(): Promise<boolean>
  /** Verifica si la impresora está conectada y lista */
  isConnected(): Promise<boolean>
  /** Imprime un texto de prueba */
  printTest(): Promise<void>
  /** Imprime una factura */
  printReceipt(data: ReceiptData): Promise<void>
  /** Imprime un reporte de cierre */
  printReport(data: ReportData): Promise<void>
  /** Abre el cajón de dinero */
  openDrawer(): Promise<void>
  /** Cierra la conexión */
  disconnect(): Promise<void>
}

export interface ReceiptData {
  businessName: string
  taxPayerId: string
  fiscalAddress?: string
  receiptNumber: number
  items: Array<{
    name: string
    quantity: number
    price: number
    taxRate: number
    total: number
  }>
  subtotal: number
  taxTotal: number
  total: number
  paymentMethod: string
  usdRate?: number
  createdAt: Date
}

export interface ReportData {
  type: 'daily' | 'monthly'
  from: Date
  to: Date
  totalSales: number
  totalAmount: number
  totalTax: number
  paymentMethods: Record<string, number>
}
