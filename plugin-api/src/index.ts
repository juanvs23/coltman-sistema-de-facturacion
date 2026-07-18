/**
 * @sistema-facturacion/plugin-api
 *
 * Public API for building plugins that integrate with
 * Sistema de Facturación POS.
 *
 * ## Usage
 *
 * ```ts
 * import { IPlugin, PluginManifest, PluginResult } from '@sistema-facturacion/plugin-api'
 *
 * export default class MyPlugin implements IPlugin {
 *   manifest = { id: 'my-plugin', /* ... * / }
 *   async activate(): Promise<PluginResult> { return { success: true } }
 *   async deactivate(): Promise<PluginResult> { return { success: true } }
 * }
 * ```
 *
 * @module
 */

// ─── Types ────────────────────────────────────────────────────
export type {
  PluginManifest,
  PluginInfo,
  PluginResult,
  PluginEventPayload,
  PluginVisibility,
  PluginTarget,
  PluginHook
} from './types'

// ─── Plugin Contracts ─────────────────────────────────────────
export type { IPlugin } from './contracts/IPlugin'

// ─── Fiscal Printer ───────────────────────────────────────────
export type {
  IFiscalPrinter,
  FiscalPrinterType,
  ReceiptLine,
  ReceiptData
} from './contracts/IFiscalPrinter'

// ─── USD Rate ─────────────────────────────────────────────────
export type {
  IUsdRateProvider,
  UsdRateSource,
  UsdRateData
} from './contracts/IUsdRateProvider'

// ─── Restaurant ───────────────────────────────────────────────
export type {
  IRestaurant,
  TableInfo,
  TableStatus,
  OrderSplit
} from './contracts/IRestaurant'

// ─── SENIAT ───────────────────────────────────────────────────
export type {
  ISeniat,
  FiscalDocument,
  SeniatSubmissionResult
} from './contracts/ISeniat'

// ─── License ──────────────────────────────────────────────────
export type {
  ILicenseManager,
  LicenseValidation,
  LicenseInfo
} from './license/ILicenseManager'
export type { FeatureDefinition } from './license/types'
export { BUILT_IN_FEATURES } from './license/types'
