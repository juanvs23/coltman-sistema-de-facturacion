import type { IFiscalPrinter } from '@plugin-api/contracts/IFiscalPrinter'

/**
 * Pure duck-typing check: does an object implement IFiscalPrinter?
 *
 * Checks for the minimum runtime interface:
 *   - `type` property (string)
 *   - `testConnection` method (function)
 *
 * Used by PluginLoader to auto-detect fiscal printer plugins
 * after activation. Extracted as a pure function for testability.
 *
 * @param plugin - Candidate plugin instance
 * @returns true if the object has the shape of an IFiscalPrinter
 */
export function isFiscalPrinterPlugin(plugin: unknown): plugin is IFiscalPrinter {
  if (typeof plugin !== 'object' || plugin === null) return false

  const p = plugin as Record<string, unknown>
  return typeof p.type === 'string' && typeof p.testConnection === 'function'
}
