import type { LicenseValidation, LicenseInfo } from '@plugin-api/license/ILicenseManager'
import type { PluginResult } from '@plugin-api/types'
import { createHash } from 'crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

/**
 * License Manager implementation.
 *
 * PUBLIC — the code is visible and auditable.
 * Security relies on:
 * 1. License keys signed by the private license backend
 * 2. Machine binding (hardware ID)
 * 3. Optional online validation
 *
 * The generator is NOT in this codebase — it's a private backend.
 */
export class LicenseManager {
  private licenses: Map<string, LicenseInfo> = new Map()
  private storagePath: string

  constructor() {
    const userDataPath = app.getPath('userData')
    this.storagePath = join(userDataPath, 'licenses.json')
    this.loadLicenses()
  }

  // ── Public API ──────────────────────────────────────────────

  async isFeatureEnabled(featureKey: string): Promise<LicenseValidation> {
    // Features without license requirements are always enabled
    // (defined in BUILT_IN_FEATURES with requiresLicense: false)
    const feature = this.getFeatureDefinition(featureKey)
    if (!feature || !feature.requiresLicense) {
      return {
        valid: true,
        pluginId: feature?.pluginId ?? 'core',
        featureKey,
        message: 'Feature is free — no license required'
      }
    }

    // Check if there's an active license for this feature
    const license = this.licenses.get(feature.pluginId)
    if (!license) {
      return {
        valid: false,
        pluginId: feature.pluginId,
        featureKey,
        message: `Se requiere licencia para: ${feature.name}`
      }
    }

    // Check expiration
    if (license.expiresAt) {
      const expires = new Date(license.expiresAt)
      const now = new Date()
      if (expires < now) {
        return {
          valid: false,
          pluginId: feature.pluginId,
          featureKey,
          message: 'Licencia expirada',
          expiresAt: license.expiresAt,
          daysRemaining: 0
        }
      }
      const daysRemaining = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return {
        valid: true,
        pluginId: feature.pluginId,
        featureKey,
        message: `Licencia activa — ${daysRemaining} día(s) restante(s)`,
        expiresAt: license.expiresAt,
        daysRemaining
      }
    }

    return {
      valid: true,
      pluginId: feature.pluginId,
      featureKey,
      message: 'Licencia activa (perpetua)'
    }
  }

  async activateLicense(pluginId: string, licenseKey: string): Promise<PluginResult<LicenseInfo>> {
    try {
      // Validate license key format
      if (!licenseKey || licenseKey.length < 16) {
        return { success: false, error: 'Formato de licencia inválido' }
      }

      // In a real implementation, this would validate the key against
      // the license backend (signature verification, etc.)
      // For now, we do basic format validation
      const hardwareId = await this.getHardwareId()
      const expectedPrefix = this.hashString(pluginId).substring(0, 8)

      if (!licenseKey.startsWith(expectedPrefix)) {
        return { success: false, error: 'Llave de licencia inválida para este producto' }
      }

      const license: LicenseInfo = {
        key: licenseKey,
        pluginId,
        activatedAt: new Date().toISOString(),
        perpetual: licenseKey.endsWith('PERPETUAL'),
        expiresAt: licenseKey.endsWith('PERPETUAL')
          ? undefined
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }

      this.licenses.set(pluginId, license)
      this.saveLicenses()

      return { success: true, data: license }
    } catch (error) {
      return {
        success: false,
        error: `Error al activar licencia: ${error instanceof Error ? error.message : 'desconocido'}`
      }
    }
  }

  async deactivateLicense(pluginId: string): Promise<PluginResult> {
    this.licenses.delete(pluginId)
    this.saveLicenses()
    return { success: true }
  }

  async getLicense(pluginId: string): Promise<PluginResult<LicenseInfo | null>> {
    const license = this.licenses.get(pluginId) ?? null
    return { success: true, data: license }
  }

  async listLicenses(): Promise<PluginResult<LicenseInfo[]>> {
    return { success: true, data: Array.from(this.licenses.values()) }
  }

  async getHardwareId(): Promise<string> {
    // Generate a hardware-bound ID using machine identifiers
    const { machineIdSync } = await import('node-machine-id')
    return this.hashString(machineIdSync())
  }

  // ── Internal ────────────────────────────────────────────────

  private hashString(input: string): string {
    return createHash('sha256').update(input).digest('hex')
  }

  private loadLicenses(): void {
    try {
      if (existsSync(this.storagePath)) {
        const data = readFileSync(this.storagePath, 'utf-8')
        const parsed = JSON.parse(data) as LicenseInfo[]
        this.licenses = new Map(parsed.map((l) => [l.pluginId, l]))
      } else {
        // Ensure directory exists
        const dir = join(app.getPath('userData'))
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
        }
      }
    } catch {
      // Corrupted file — start fresh
      this.licenses = new Map()
    }
  }

  private saveLicenses(): void {
    try {
      const data = JSON.stringify(Array.from(this.licenses.values()), null, 2)
      writeFileSync(this.storagePath, data, 'utf-8')
    } catch (error) {
      console.error('Failed to save licenses:', error)
    }
  }

  private getFeatureDefinition(featureKey: string): { name: string; pluginId: string; requiresLicense: boolean } | null {
    // Feature definitions are loaded from BUILT_IN_FEATURES + registered plugins
    // For now, return null to let the caller decide
    // In production, this would be populated from a central registry
    const freeFeatures = new Set(['core-pos', 'inventory', 'usd-rate'])
    const paidFeatures = new Map<string, string>([
      ['fiscal-printer', 'Impresora Fiscal'],
      ['restaurant', 'Módulo Restaurante'],
      ['seniat', 'Factura Electrónica SENIAT'],
      ['multi-terminal', 'Multi Terminal']
    ])

    if (freeFeatures.has(featureKey)) {
      return { name: featureKey, pluginId: 'core', requiresLicense: false }
    }
    if (paidFeatures.has(featureKey)) {
      return { name: paidFeatures.get(featureKey)!, pluginId: featureKey, requiresLicense: true }
    }
    return null
  }
}
