import type { PluginResult } from '../types'
import type { ReceiptData } from './IFiscalPrinter'

/**
 * Contract for NON-fiscal (basic) printer plugins.
 *
 * Provides essential printing operations without any fiscal
 * compliance requirements. Distinguished from {@link IFiscalPrinter}
 * by the absence of `printInvoice`.
 *
 * Duck-typing detection: has `printReceipt`, `testConnection`,
 * `getStatus`, `openDrawer` but does NOT have `printInvoice`.
 */
export interface IBasicPrinter {
  /** Printer type identifier */
  readonly type: string

  /** Human-readable printer name */
  readonly displayName: string

  /**
   * Test connection to the printer.
   * Returns success if the printer is reachable and ready.
   */
  testConnection(): Promise<PluginResult>

  /**
   * Print a receipt (non-fiscal).
   * Reuses {@link ReceiptData} from the fiscal printer contract
   * to avoid type duplication.
   */
  printReceipt(data: ReceiptData): Promise<PluginResult>

  /**
   * Open the cash drawer (if the printer supports it).
   */
  openDrawer(): Promise<PluginResult>

  /**
   * Get printer status (online, paper out, drawer open, etc.).
   */
  getStatus(): Promise<PluginResult<{
    online: boolean
    paperOut: boolean
    drawerOpen: boolean
  }>>
}
