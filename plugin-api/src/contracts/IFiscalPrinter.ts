import type { PluginResult } from '../types'

/**
 * Fiscal printer types supported by the system.
 */
export type FiscalPrinterType = 'bixolon' | 'epson' | 'sharp' | 'sam4s'

/**
 * A receipt line to be printed.
 */
export interface ReceiptLine {
  type: 'text' | 'separator' | 'item' | 'total' | 'barcode'
  text: string
  /** Quantity for item lines */
  quantity?: number
  /** Price for item lines */
  price?: number
  /** Font size */
  fontSize?: 'normal' | 'small' | 'large'
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
}

/**
 * Complete receipt data for printing.
 */
export interface ReceiptData {
  header: string[]
  lines: ReceiptLine[]
  footer: string[]
  /** Optional logo path */
  logoPath?: string
}

/**
 * Contract for fiscal printer plugins.
 *
 * Each supported printer brand implements this interface.
 * The core loads the appropriate implementation based on FiscalConfig.printerType.
 */
export interface IFiscalPrinter {
  /** Printer type identifier */
  readonly type: FiscalPrinterType

  /** Human-readable printer name */
  readonly displayName: string

  /**
   * Test connection to the printer.
   * Returns success if the printer is reachable and ready.
   */
  testConnection(): Promise<PluginResult>

  /**
   * Print a sales receipt.
   */
  printReceipt(data: ReceiptData): Promise<PluginResult>

  /**
   * Open the cash drawer (if the printer supports it).
   */
  openDrawer(): Promise<PluginResult>

  /**
   * Get printer status (online, paper out, etc.).
   */
  getStatus(): Promise<PluginResult<{
    online: boolean
    paperOut: boolean
    drawerOpen: boolean
  }>>

  /**
   * Print a daily closing report (Z report).
   * Required for fiscal compliance in some jurisdictions.
   */
  printDailyReport?(totals: {
    salesCount: number
    totalAmount: number
    taxTotal: number
  }): Promise<PluginResult>
}
