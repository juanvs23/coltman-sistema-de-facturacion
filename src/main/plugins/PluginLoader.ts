import { readdirSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { IPlugin } from '@plugin-api/contracts/IPlugin'
import type { PluginInfo, PluginResult, PluginManifest } from '@plugin-api/types'
import type { ICountryPlugin } from '@plugin-api/contracts/ICountryPlugin'
import { loadPluginManifest } from './PluginManifest'
import { PluginStateStore } from './PluginStateStore'
import type { LicenseManager } from '../core/license/LicenseManager'
import type { AppKernel } from '../core/kernel/AppKernel'

/**
 * Plugin Loader — discovers, validates, and activates plugins.
 *
 * Plugins can be:
 * 1. Built-in: shipped with the core in `src/main/plugins/built-in/`
 * 2. External: installed by the user in the `plugins/` directory
 * 3. Project-level: bundled in `plugins/` at the app root
 *
 * The loader keeps internal IPlugin instances for lifecycle operations
 * (activate/deactivate/toggle) and registers manifests in the kernel's
 * PluginRegistry for querying and hook dispatching.
 */
export class PluginLoader {
  private plugins: Map<string, IPlugin> = new Map()
  private kernel: AppKernel
  private licenseManager: LicenseManager
  private pluginsDir: string
  private builtInDir: string
  private projectPluginsDir: string
  private stateStore: PluginStateStore

  constructor(kernel: AppKernel, licenseManager: LicenseManager) {
    this.kernel = kernel
    this.licenseManager = licenseManager
    this.pluginsDir = join(app.getPath('userData'), 'plugins')
    this.builtInDir = join(__dirname, 'built-in')
    this.projectPluginsDir = join(app.getAppPath(), 'plugins')
    this.stateStore = new PluginStateStore()

    // Ensure plugins directory exists
    if (!existsSync(this.pluginsDir)) {
      mkdirSync(this.pluginsDir, { recursive: true })
    }
  }

  async loadPlugins(): Promise<void> {
    // Load built-in plugins first
    await this.loadFromDirectory(this.builtInDir, 'core')

    // Load project-level bundled plugins (e.g. plugin-ve)
    await this.loadFromDirectory(this.projectPluginsDir, 'external')

    // Load user-installed external plugins
    await this.loadFromDirectory(this.pluginsDir, 'external')

    // Register all discovered plugins in the kernel's PluginRegistry
    for (const [id, plugin] of this.plugins) {
      try {
        this.kernel.pluginRegistryInternal.register(
          plugin.manifest,
          // Factory wrapper — the instance is already created
          async () => ({ success: true })
        )
      } catch {
        // Duplicate registration is silently skipped
      }
    }

    // Activate only active plugins
    for (const [id, plugin] of this.plugins) {
      if (!this.stateStore.isActive(id)) {
        console.log(`Plugin "${id}" is disabled, skipping activation`)
        continue
      }
      try {
        const result = await plugin.activate()
        if (result.success) {
          this.kernel.pluginRegistryInternal.activate(id)

          // Detect country plugins and register them with the kernel
          this.tryRegisterCountryPlugin(plugin)
        } else {
          console.warn(`Plugin "${id}" failed to activate: ${result.error}`)
        }
      } catch (error) {
        console.error(`Plugin "${id}" crashed during activation:`, error)
      }
    }
  }

  /**
   * Get a plugin instance by id (for internal lifecycle operations).
   * Plugins should use kernel.pluginRegistry.getPlugin() for querying.
   */
  getInstance<T>(id: string): T | null {
    const plugin = this.plugins.get(id)
    return plugin ? (plugin as unknown as T) : null
  }

  /**
   * Get plugin info from the kernel's PluginRegistry.
   * Delegates to kernel for consistent state.
   */
  async getPlugin<T>(id: string): Promise<T | null> {
    const info = this.kernel.pluginRegistry.getPlugin(id)
    return info as unknown as T | null
  }

  async listPlugins(): Promise<PluginInfo[]> {
    // Delegate to kernel's PluginRegistry for consistent state
    return this.kernel.pluginRegistry.list()
  }

  async installPlugin(source: string): Promise<PluginResult<PluginInfo>> {
    try {
      // Check license if the plugin is premium
      const manifest = loadPluginManifest(source)
      if (!manifest) {
        return { success: false, error: 'plugin.json no encontrado o inválido' }
      }

      if (manifest.requiresLicense) {
        const licenseCheck = await this.licenseManager.isFeatureEnabled(manifest.id)
        if (!licenseCheck.valid) {
          return {
            success: false,
            error: licenseCheck.message
          }
        }
      }

      // TODO: Copy plugin from source to pluginsDir
      // For now, attempt to load directly
      const plugin = await this.loadPlugin(source, 'external')
      if (!plugin) {
        return { success: false, error: 'No se pudo cargar el plugin' }
      }

      this.plugins.set(manifest.id, plugin)

      // Register in kernel
      try {
        this.kernel.pluginRegistryInternal.register(
          manifest,
          async () => ({ success: true })
        )
      } catch {
        // Already registered — skip
      }

      const result = await plugin.activate()
      if (!result.success) {
        return { success: false, error: result.error ?? 'Error al activar plugin' }
      }

      this.kernel.pluginRegistryInternal.activate(manifest.id)
      this.tryRegisterCountryPlugin(plugin)

      return {
        success: true,
        data: {
          id: manifest.id,
          name: manifest.name,
          version: manifest.version,
          description: manifest.description,
          author: manifest.author,
          enabled: this.stateStore.isActive(manifest.id),
          visibility: manifest.visibility,
          target: manifest.target,
          hooks: manifest.hooks
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Error al instalar plugin: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  async uninstallPlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id)
    if (plugin) {
      await plugin.deactivate()
      this.plugins.delete(id)
      this.kernel.pluginRegistryInternal.deactivate(id)
    }
  }

  /** Activa o desactiva un plugin en caliente */
  async togglePlugin(id: string): Promise<PluginResult<{ active: boolean }>> {
    const plugin = this.plugins.get(id)
    if (!plugin) return { success: false, error: 'Plugin no encontrado' }

    const entry = this.stateStore.toggleActive(id)
    if (entry.active) {
      try {
        const result = await plugin.activate()
        if (!result.success) {
          this.stateStore.save(id, { ...entry, active: false })
          return { success: false, error: result.error ?? 'Error al activar' }
        }
        this.kernel.pluginRegistryInternal.activate(id)
      } catch {
        this.stateStore.save(id, { ...entry, active: false })
        return { success: false, error: 'Error al activar el plugin' }
      }
    } else {
      await plugin.deactivate()
      this.kernel.pluginRegistryInternal.deactivate(id)
    }
    return { success: true, data: { active: entry.active } }
  }

  isActive(id: string): boolean {
    return this.stateStore.isActive(id)
  }

  /**
   * @deprecated Use kernel.hookBus.on() / kernel.hookBus.action() instead.
   * This method is no longer supported since plugins now subscribe directly
   * to the HookBus. Callers should migrate to kernel.hookBus.action().
   */
  async dispatchHook(_hook: string, _data?: Record<string, unknown>): Promise<void> {
    console.warn('[PluginLoader] dispatchHook is deprecated. Use kernel.hookBus.action() instead.')
  }

  // ── Private ─────────────────────────────────────────────────

  /**
   * Check if a plugin instance implements ICountryPlugin and register it
   * with the kernel if it does.
   */
  private tryRegisterCountryPlugin(plugin: IPlugin): void {
    const countryPlugin = plugin as unknown as ICountryPlugin
    if (countryPlugin.countryCode && typeof countryPlugin.validateTaxId === 'function') {
      const code = countryPlugin.countryCode
      this.kernel.registerCountryPlugin(plugin.manifest.id, code)
      this.kernel.registerCountryPluginInstance(plugin.manifest.id, countryPlugin)
      console.log(`[PluginLoader] Registered country plugin "${plugin.manifest.id}" for ${code}`)
    }
  }

  private async loadFromDirectory(dir: string, type: 'core' | 'external'): Promise<void> {
    if (!existsSync(dir)) return

    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const pluginDir = join(dir, entry.name)
      const plugin = await this.loadPlugin(pluginDir, type)
      if (plugin) {
        this.plugins.set(plugin.manifest.id, plugin)
      }
    }
  }

  private async loadPlugin(pluginDir: string, type: 'core' | 'external'): Promise<IPlugin | null> {
    const manifest = loadPluginManifest(pluginDir)
    if (!manifest) {
      console.warn(`Skipping ${pluginDir}: no valid plugin.json`)
      return null
    }

    try {
      // Dynamic import of the plugin's main file
      const pluginModule = await import(/* @vite-ignore */ join(pluginDir, 'index.ts'))
      const PluginClass = pluginModule.default

      if (!PluginClass || typeof PluginClass !== 'function') {
        console.warn(`Plugin "${manifest.id}" has no default export`)
        return null
      }

      return new PluginClass() as IPlugin
    } catch (error) {
      console.error(`Failed to load plugin "${manifest.id}" from ${pluginDir}:`, error)
      return null
    }
  }
}
