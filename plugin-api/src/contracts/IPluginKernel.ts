/**
 * Plugin Kernel — the central gateway that plugins use to
 * interact with the POS core.
 *
 * Provides access to four registries:
 * - PluginRegistry: query installed plugins and their status
 * - HookBus: subscribe to events and filter pipelines
 * - UiRegistry: extend the POS interface
 * - DataModelRegistry: extend the database schema
 *
 * @example
 * ```ts
 * import { IPluginKernel } from '@sistema-facturacion/plugin-api'
 *
 * class MyPlugin implements IPlugin {
 *   async activate(kernel: IPluginKernel): Promise<PluginResult> {
 *     kernel.hookBus.on('sale:completed', (data) => {
 *       console.log('Sale:', data)
 *     })
 *     return { success: true }
 *   }
 * }
 * ```
 */

import type { IHookSubscriber } from './IHookSubscriber'
import type { IPluginUI } from './IPluginUI'
import type { IPluginDataModel } from './IPluginDataModel'
import type { PluginManifest, PluginInfo } from '../types'

/**
 * Read-only view of the plugin registry exposed to plugins.
 */
export interface IPluginRegistry {
  /** Get a registered plugin's info by id (null if not found) */
  getPlugin(id: string): PluginInfo | null

  /** List all registered plugins */
  list(): PluginInfo[]

  /** Check if a plugin is currently active */
  isActive(id: string): boolean
}

/**
 * Central kernel interface that plugins receive to interact
 * with the POS system.
 */
export interface IPluginKernel {
  /** Read-only plugin registry access */
  readonly pluginRegistry: IPluginRegistry

  /** Hook/event bus for subscribing to actions and filters */
  readonly hookBus: IHookSubscriber

  /** UI extension registry */
  readonly uiRegistry: IPluginUI

  /** Data model extension registry */
  readonly dataModelRegistry: IPluginDataModel
}
