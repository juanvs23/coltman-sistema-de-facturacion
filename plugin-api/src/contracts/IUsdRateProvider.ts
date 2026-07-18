import type { PluginResult } from '../types'

/**
 * USD rate source identifier.
 */
export type UsdRateSource = 'bcv' | 'enparalelo' | 'criptodolar' | 'manual'

/**
 * USD rate data returned by providers.
 */
export interface UsdRateData {
  /** Buy rate in Bs. */
  buyRate: number
  /** Sell rate in Bs. */
  sellRate: number
  /** Source identifier */
  source: UsdRateSource
  /** When this rate was fetched */
  updatedAt: string
}

/**
 * Contract for USD rate provider plugins.
 *
 * Each source (BCV, EnParaleloVzla, CriptoDólar) implements this
 * to supply exchange rates to the POS.
 */
export interface IUsdRateProvider {
  /** Source identifier (matches UsdRateSource) */
  readonly source: UsdRateSource

  /** Display name for the UI */
  readonly displayName: string

  /**
   * Fetch the current USD rate from this source.
   */
  fetchRate(): Promise<PluginResult<UsdRateData>>

  /**
   * Whether this provider requires an internet connection.
   */
  readonly requiresInternet: boolean

  /**
   * Optional: estimated time between rate updates in seconds.
   * Used to avoid hammering the source.
   */
  readonly pollIntervalSeconds?: number
}
