import type { PluginResult } from '../types'

/**
 * License validation result.
 */
export interface LicenseValidation {
  /** Whether the license is valid */
  valid: boolean
  /** Plugin ID this license is for */
  pluginId: string
  /** Feature key that was checked */
  featureKey: string
  /** Human-readable message */
  message: string
  /** Expiration date if applicable */
  expiresAt?: string
  /** Days remaining until expiration */
  daysRemaining?: number
}

/**
 * License information stored locally.
 */
export interface LicenseInfo {
  /** License key string */
  key: string
  /** Plugin this license is for */
  pluginId: string
  /** Customer identifier */
  customerId?: string
  /** Customer email */
  customerEmail?: string
  /** When the license was activated */
  activatedAt: string
  /** When the license expires (if subscription) */
  expiresAt?: string
  /** Whether this is a perpetual license */
  perpetual: boolean
}

/**
 * Public contract for the License Manager.
 *
 * The core exposes this interface to plugins so they can
 * check their own license status. The actual validation
 * logic and key generation are handled by the private
 * license backend, not this interface.
 *
 * @remarks
 * This is a PUBLIC interface. The validation code is visible
 * and auditable. Security comes from the backend that generates
 * signed licenses, not from hiding the verification logic.
 */
export interface ILicenseManager {
  /**
   * Check whether a specific feature is enabled.
   * Features without license requirements always return true.
   *
   * @param featureKey — Unique feature identifier (e.g. "fiscal-printer", "seniat")
   * @returns Validation result with details
   */
  isFeatureEnabled(featureKey: string): Promise<LicenseValidation>

  /**
   * Activate a license key for a plugin.
   *
   * @param pluginId — Plugin identifier
   * @param licenseKey — License key provided by the customer
   * @returns Validation result
   */
  activateLicense(pluginId: string, licenseKey: string): Promise<PluginResult<LicenseInfo>>

  /**
   * Deactivate/deauthorize a license on this machine.
   */
  deactivateLicense(pluginId: string): Promise<PluginResult>

  /**
   * Get stored license info for a plugin.
   */
  getLicense(pluginId: string): Promise<PluginResult<LicenseInfo | null>>

  /**
   * List all active licenses on this machine.
   */
  listLicenses(): Promise<PluginResult<LicenseInfo[]>>

  /**
   * Called when the machine hardware ID is needed for license binding.
   */
  getHardwareId(): Promise<string>
}
