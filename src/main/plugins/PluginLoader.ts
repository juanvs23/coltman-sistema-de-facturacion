import { readdirSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { IPlugin } from '@plugin-api/contracts/IPlugin'
import type { PluginInfo, PluginResult, PluginEventPayload } from '@plugin-api/types'
import { loadPluginManifest } from './PluginManifest'
import type { LicenseManager } from '../core/license/LicenseManager'

/**
 * Plugin Loader — discovers, validates, and activates plugins.
 *
 * Plugins can be:
 * 1. Built-in: shipped with the core in `src/main/plugins/built-in/`
 * 2. External: installed by the user in the `plugins/` directory
 * 3. npm packages loaded from `node_modules/` (future)
 */
export class PluginLoader {
  private plugins: Map<string, IPlugin> = new Map()
  private licenseManager: LicenseManager
  private pluginsDir: string
  private builtInDir: string

  constructor(licenseManager: LicenseManager) {
    this.licenseManager = licenseManager
    this.pluginsDir = join(app.getPath('userData'), 'plugins')
    this.builtInDir = join(__dirname, 'built-in')

    // Ensure plugins directory exists
    if (!existsSync(this.pluginsDir)) {
      mkdirSync(this.pluginsDir, { recursive: true })
    }
  }

  async loadPlugins(): Promise<void> {
    // Load built-in plugins first
    await this.loadFromDirectory(this.builtInDir, 'core')

    // Load external plugins
    await this.loadFromDirectory(this.pluginsDir, 'external')

    // Activate all loaded plugins
    for (const [id, plugin] of this.plugins) {
      try {
        const result = await plugin.activate()
        if (!result.success) {
          console.warn(`Plugin "${id}" failed to activate: ${result.error}`)
        }
      } catch (error) {
        console.error(`Plugin "${id}" crashed during activation:`, error)
      }
    }
  }

  async getPlugin<T>(id: string): Promise<T | null> {
    const plugin = this.plugins.get(id)
    return plugin ? (plugin as unknown as T) : null
  }

  async listPlugins(): Promise<PluginInfo[]> {
    return Array.from(this.plugins.values()).map((plugin) => ({
      id: plugin.manifest.id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      description: plugin.manifest.description,
      author: plugin.manifest.author,
      enabled: true,
      visibility: plugin.manifest.visibility ?? 'internal',
      target: plugin.manifest.target ?? 'main',
      hooks: plugin.manifest.hooks ?? []
    }))
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
      const result = await plugin.activate()
      if (!result.success) {
        return { success: false, error: result.error ?? 'Error al activar plugin' }
      }

      return {
        success: true,
        data: {
          id: manifest.id,
          name: manifest.name,
          version: manifest.version,
          description: manifest.description,
          author: manifest.author,
          enabled: true,
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
    }
  }

  async dispatchHook(hook: string, data: Record<string, unknown> = {}): Promise<void> {
    const event: PluginEventPayload = {
      hook: hook as PluginEventPayload['hook'],
      timestamp: new Date().toISOString(),
      data
    }

    for (const [, plugin] of this.plugins) {
      if (plugin.manifest.hooks?.includes(event.hook) && plugin.onHook) {
        try {
          await plugin.onHook(event)
        } catch (error) {
          console.error(`Plugin "${plugin.manifest.id}" failed on hook "${hook}":`, error)
        }
      }
    }
  }

  // ── Private ─────────────────────────────────────────────────

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
