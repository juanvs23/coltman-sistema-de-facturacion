/**
 * Plugin Registry — manages plugin lifecycle (registration, activation,
 * deactivation) and provides query methods.
 *
 * In Phase 1 this is a pure state manager. Phase 2 will wire it to
 * the actual plugin factory/discovery pipeline.
 *
 * @packageDocumentation
 */

import type { PluginManifest, PluginInfo, PluginResult } from '@plugin-api/types'

/** Internal registration entry */
interface PluginEntry {
  manifest: PluginManifest
  factory: () => Promise<PluginResult>
  active: boolean
}

/**
 * PluginRegistry — singleton-like registry that tracks all plugins
 * and their lifecycle state.
 *
 * @example
 * ```ts
 * const registry = new PluginRegistry()
 * registry.register(manifest, factory)
 * registry.activate('my-plugin')
 * console.log(registry.isActive('my-plugin')) // true
 * ```
 */
export class PluginRegistry {
  private plugins: Map<string, PluginEntry> = new Map()

  /**
   * Register a plugin with its manifest and factory function.
   *
   * @param manifest - Plugin manifest metadata
   * @param factory - Async factory that creates the plugin instance
   * @throws {Error} If a plugin with the same id is already registered
   */
  register(manifest: PluginManifest, factory: () => Promise<PluginResult>): void {
    if (this.plugins.has(manifest.id)) {
      throw new Error(
        `Plugin "${manifest.id}" ya está registrado. No se permiten ids duplicados.`
      )
    }
    this.plugins.set(manifest.id, {
      manifest,
      factory,
      active: false
    })
  }

  /**
   * Activate a registered plugin by id.
   *
   * @param id - Plugin identifier
   * @throws {Error} If the plugin is not registered
   */
  activate(id: string): void {
    const entry = this.plugins.get(id)
    if (!entry) {
      throw new Error(`Plugin "${id}" no encontrado. No se puede activar.`)
    }
    entry.active = true
  }

  /**
   * Deactivate a registered plugin by id.
   *
   * @param id - Plugin identifier
   * @throws {Error} If the plugin is not registered
   */
  deactivate(id: string): void {
    const entry = this.plugins.get(id)
    if (!entry) {
      throw new Error(`Plugin "${id}" no encontrado. No se puede desactivar.`)
    }
    entry.active = false
  }

  /**
   * Check if a plugin is currently active.
   *
   * @param id - Plugin identifier
   * @returns true if the plugin is registered and active
   */
  isActive(id: string): boolean {
    return this.plugins.get(id)?.active ?? false
  }

  /**
   * List all registered plugins with their current state.
   */
  list(): PluginInfo[] {
    return Array.from(this.plugins.values()).map(this.toPluginInfo)
  }

  /**
   * Get a specific plugin's info by id.
   *
   * @param id - Plugin identifier
   * @returns PluginInfo or null if not found
   */
  getPlugin(id: string): PluginInfo | null {
    const entry = this.plugins.get(id)
    return entry ? this.toPluginInfo(entry) : null
  }

  /** Transform internal entry to public PluginInfo */
  private toPluginInfo(entry: PluginEntry): PluginInfo {
    return {
      id: entry.manifest.id,
      name: entry.manifest.name,
      version: entry.manifest.version,
      description: entry.manifest.description,
      author: entry.manifest.author,
      enabled: entry.active,
      visibility: entry.manifest.visibility,
      target: entry.manifest.target,
      hooks: entry.manifest.hooks
    }
  }
}
