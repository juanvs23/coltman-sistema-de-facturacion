import type { IBasicPrinter } from '@plugin-api/contracts/IBasicPrinter'
import type { IFiscalPrinter } from '@plugin-api/contracts/IFiscalPrinter'

/**
 * Pure duck-typing check: does an object implement IBasicPrinter?
 *
 * Checks for the minimum runtime interface:
 *   - `testConnection`, `printReceipt`, `getStatus`, `openDrawer` methods (all functions)
 *   - Does NOT include `printInvoice` (which would make it an IFiscalPrinter)
 *
 * Used by PluginLoader to auto-detect basic printer plugins
 * after activation. Extracted as a pure function for testability.
 *
 * @param plugin - Candidate plugin instance
 * @returns true if the object has the shape of an IBasicPrinter
 */
export function isBasicPrinterPlugin(plugin: unknown): plugin is IBasicPrinter {
  if (typeof plugin !== 'object' || plugin === null) return false

  const p = plugin as Record<string, unknown>

  // Must have all 4 required methods
  const hasMethods =
    typeof p.testConnection === 'function' &&
    typeof p.printReceipt === 'function' &&
    typeof p.getStatus === 'function' &&
    typeof p.openDrawer === 'function'

  if (!hasMethods) return false

  // Must NOT have printInvoice (fiscal exclusion — prevents misdetection)
  const hasPrintInvoice =
    typeof (plugin as Partial<IFiscalPrinter>).printInvoice === 'function'

  return !hasPrintInvoice
}
