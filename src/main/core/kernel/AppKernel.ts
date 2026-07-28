/**
 * App Kernel — singleton container that holds the four core registries
 * and provides access to them.
 *
 * The kernel is the central hub of the plugin architecture:
 * - PluginRegistry: manages plugin lifecycle (register, activate, deactivate)
 * - HookBus: event system for core-plugin communication
 * - UiRegistry: manages plugin UI extensions
 * - DataModelRegistry: manages plugin data model schemas
 *
 * @example
 * ```ts
 * // Get the kernel singleton
 * const kernel = AppKernel.getInstance()
 *
 * // Initialize with dependencies (called once at app startup)
 * await kernel.init(prisma, mainWindow)
 *
 * // Access registries
 * kernel.pluginRegistry.register(manifest, factory)
 * kernel.hookBus.on('sale:completed', handler)
 * ```
 *
 * @packageDocumentation
 */

// Prisma and BrowserWindow types are referenced in JSDoc only.
// The actual values are injected at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClient = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BrowserWindow = any

import { PluginRegistry } from './PluginRegistry'
import { HookBus } from './HookBus'
import { UiRegistry } from './UiRegistry'
import { DataModelRegistry } from './DataModelRegistry'
import type { IPluginKernel, IPluginRegistry } from '@plugin-api/contracts/IPluginKernel'
import type { IHookSubscriber } from '@plugin-api/contracts/IHookSubscriber'
import type { IPluginUI } from '@plugin-api/contracts/IPluginUI'
import type { IPluginDataModel } from '@plugin-api/contracts/IPluginDataModel'
import type { ICountryPlugin } from '@plugin-api/contracts/ICountryPlugin'
import type { IFiscalPrinter } from '@plugin-api/contracts/IFiscalPrinter'
import type { IBasicPrinter } from '@plugin-api/contracts/IBasicPrinter'

/**
 * Singleton kernel that orchestrates the plugin system.
 *
 * Implements IPluginKernel to expose controlled access to plugins.
 */
export class AppKernel implements IPluginKernel {
  /** Singleton instance */
  private static instance: AppKernel | null = null

  /** Prisma client — set during init() */
  private _prisma: PrismaClient | null = null

  /** Main BrowserWindow — set during init() */
  private _mainWindow: BrowserWindow | null = null

  /** Whether init() has been called successfully */
  private _initialized = false

  /** Internal registries */
  private _pluginRegistry: PluginRegistry
  private _hookBus: HookBus
  private _uiRegistry: UiRegistry
  private _dataModelRegistry: DataModelRegistry

  /** Map of country code → plugin id for country plugin resolution */
  private _countryPluginMap: Map<string, string> = new Map()

  /** Map of plugin id → country plugin instance (set by PluginLoader) */
  private _countryPluginInstances: Map<string, ICountryPlugin> = new Map()

  /** Currently registered fiscal printer plugin id (only one at a time) */
  private _fiscalPrinterPluginId: string | null = null

  /** Currently registered fiscal printer instance */
  private _fiscalPrinterInstance: IFiscalPrinter | null = null

  /** Currently registered basic printer plugin id (only one at a time) */
  private _basicPrinterPluginId: string | null = null

  /** Currently registered basic printer instance */
  private _basicPrinterInstance: IBasicPrinter | null = null

  // ─── IPluginKernel accessors ───────────────────────────────

  readonly pluginRegistry: IPluginRegistry
  readonly hookBus: IHookSubscriber
  readonly uiRegistry: IPluginUI
  readonly dataModelRegistry: IPluginDataModel

  /**
   * Private constructor — use AppKernel.getInstance().
   */
  private constructor() {
    this._pluginRegistry = new PluginRegistry()
    this._hookBus = new HookBus()
    this._uiRegistry = new UiRegistry()
    this._dataModelRegistry = new DataModelRegistry()

    // Assign internal registries to IPluginKernel readonly accessors.
    // The PluginRegistry is exposed via IPluginRegistry (read-only view).
    this.pluginRegistry = this._pluginRegistry
    this.hookBus = this._hookBus
    this.uiRegistry = this._uiRegistry
    this.dataModelRegistry = this._dataModelRegistry
  }

  /**
   * Get the singleton AppKernel instance.
   * Creates the instance on first call.
   */
  static getInstance(): AppKernel {
    if (!AppKernel.instance) {
      AppKernel.instance = new AppKernel()
    }
    return AppKernel.instance
  }

  /**
   * Initialize the kernel with runtime dependencies.
   *
   * @param prisma - Prisma client instance
   * @param mainWindow - Electron BrowserWindow (for IPC bridge in Phase 3)
   */
  async init(prisma: PrismaClient, mainWindow: BrowserWindow): Promise<void> {
    this._prisma = prisma
    this._mainWindow = mainWindow
    this._initialized = true
  }

  /**
   * Whether the kernel has been initialized.
   */
  get initialized(): boolean {
    return this._initialized
  }

  /**
   * Access the raw PluginRegistry (for kernel-internal use).
   * Plugins should use `kernel.pluginRegistry` (read-only).
   */
  get pluginRegistryInternal(): PluginRegistry {
    return this._pluginRegistry
  }

  /**
   * Access the raw HookBus (for kernel-internal use).
   * Plugins should use `kernel.hookBus`.
   */
  get hookBusInternal(): HookBus {
    return this._hookBus
  }

  /**
   * Access the raw UiRegistry (for kernel-internal use).
   */
  get uiRegistryInternal(): UiRegistry {
    return this._uiRegistry
  }

  /**
   * Access the raw DataModelRegistry (for kernel-internal use).
   */
  get dataModelRegistryInternal(): DataModelRegistry {
    return this._dataModelRegistry
  }

  // ─── Country Plugin Resolution ─────────────────────────────

  /**
   * Register a plugin as the country handler for a specific country code.
   * Called by PluginLoader when it discovers a country plugin.
   *
   * @param pluginId - The plugin's manifest id (e.g. "plugin-ve")
   * @param countryCode - ISO country code (e.g. "VE")
   */
  registerCountryPlugin(pluginId: string, countryCode: string): void {
    this._countryPluginMap.set(countryCode, pluginId)
  }

  /**
   * Store a country plugin instance for direct access.
   * Called by PluginLoader after instantiating the plugin.
   */
  registerCountryPluginInstance(pluginId: string, instance: ICountryPlugin): void {
    this._countryPluginInstances.set(pluginId, instance)
  }

  /**
   * Unregister a country plugin, cleaning up both maps.
   * Called by PluginLoader when a plugin is deactivated.
   */
  unregisterCountryPlugin(pluginId: string): void {
    for (const [code, id] of this._countryPluginMap) {
      if (id === pluginId) {
        this._countryPluginMap.delete(code)
      }
    }
    this._countryPluginInstances.delete(pluginId)
  }

  // ─── Fiscal Printer Resolution ─────────────────────────────

  /**
   * Register a plugin as the fiscal printer handler.
   * Only one fiscal printer can be registered at a time.
   * Called by PluginLoader when it discovers a fiscal printer plugin.
   *
   * @param pluginId - The plugin's manifest id (e.g. "fiscal-bixolon")
   */
  registerFiscalPrinter(pluginId: string): void {
    this._fiscalPrinterPluginId = pluginId
  }

  /**
   * Store a fiscal printer instance for direct access.
   * Called by PluginLoader after instantiating the plugin.
   */
  registerFiscalPrinterInstance(pluginId: string, instance: IFiscalPrinter): void {
    if (this._fiscalPrinterPluginId === pluginId) {
      this._fiscalPrinterInstance = instance
    }
  }

  /**
   * Unregister the fiscal printer plugin, clearing instance.
   * Called by PluginLoader when a plugin is deactivated.
   */
  unregisterFiscalPrinter(pluginId: string): void {
    if (this._fiscalPrinterPluginId === pluginId) {
      this._fiscalPrinterPluginId = null
      this._fiscalPrinterInstance = null
    }
  }

  /**
   * Get the active fiscal printer plugin synchronously.
   * Returns null if no fiscal printer is registered.
   *
   * Unlike getCountryPlugin(), this is synchronous because
   * there is no DB lookup needed — the plugin is either
   * registered or not.
   */
  getFiscalPrinter(): IFiscalPrinter | null {
    return this._fiscalPrinterInstance
  }

  /**
   * Check if a fiscal printer plugin has been registered
   * (regardless of whether its instance is active).
   * Used to distinguish PLUGIN_NOT_AVAILABLE from PLUGIN_NOT_ACTIVE.
   */
  hasFiscalPrinterPlugin(): boolean {
    return this._fiscalPrinterPluginId !== null
  }

  // ─── Basic Printer Resolution ─────────────────────────────

  /**
   * Register a plugin as the basic printer handler.
   * Only one basic printer can be registered at a time.
   * Called by PluginLoader when it discovers a basic printer plugin.
   *
   * @param pluginId - The plugin's manifest id (e.g. "basic-printer")
   */
  registerBasicPrinter(pluginId: string): void {
    this._basicPrinterPluginId = pluginId
  }

  /**
   * Store a basic printer instance for direct access.
   * Called by PluginLoader after instantiating the plugin.
   * Only stores if the pluginId matches the currently registered basic printer.
   */
  registerBasicPrinterInstance(pluginId: string, instance: IBasicPrinter): void {
    if (this._basicPrinterPluginId === pluginId) {
      this._basicPrinterInstance = instance
    }
  }

  /**
   * Unregister the basic printer plugin, clearing instance.
   * Called by PluginLoader when a plugin is deactivated.
   */
  unregisterBasicPrinter(pluginId: string): void {
    if (this._basicPrinterPluginId === pluginId) {
      this._basicPrinterPluginId = null
      this._basicPrinterInstance = null
    }
  }

  /**
   * Get the active basic printer plugin synchronously.
   * Returns null if no basic printer is registered.
   *
   * Unlike getCountryPlugin(), this is synchronous because
   * there is no DB lookup needed — the plugin is either
   * registered or not.
   */
  getBasicPrinter(): IBasicPrinter | null {
    return this._basicPrinterInstance
  }

  /**
   * Check if a basic printer plugin has been registered
   * (regardless of whether its instance is active).
   * Used to distinguish PLUGIN_NOT_AVAILABLE from PLUGIN_NOT_ACTIVE.
   */
  hasBasicPrinterPlugin(): boolean {
    return this._basicPrinterPluginId !== null
  }

  /**
   * Get the active country plugin based on AppConfig.country.
   * Returns null if:
   * - The kernel is not initialized
   * - No country is configured in AppConfig
   * - No plugin matches the configured country code
   *
   * This is the central method for core neutro — all country-specific
   * queries must go through this method.
   */
  async getCountryPlugin(): Promise<ICountryPlugin | null> {
    if (!this._prisma) return null

    try {
      const config = await this._prisma.appConfig.findUnique({
        where: { id: 'default' }
      })

      if (!config?.country) return null
      const pluginId = this._countryPluginMap.get(config.country)

      if (!pluginId) return null
      return this._countryPluginInstances.get(pluginId) ?? null
    } catch {
      return null
    }
  }

  /**
   * Reset the singleton (for testing purposes).
   */
  static reset(): void {
    AppKernel.instance = null
  }
}
