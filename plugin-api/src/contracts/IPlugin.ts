import type { PluginManifest, PluginEventPayload, PluginResult } from '../types'

/**
 * Base interface that every plugin must implement.
 *
 * @example
 * ```ts
 * import { IPlugin, PluginManifest } from '@sistema-facturacion/plugin-api'
 *
 * const manifest: PluginManifest = {
 *   id: 'my-plugin',
 *   name: 'My Plugin',
 *   version: '1.0.0',
 *   // ...
 * }
 *
 * export default class MyPlugin implements IPlugin {
 *   manifest = manifest
 *
 *   async activate(): Promise<PluginResult> {
 *     // Initialize your plugin
 *     return { success: true }
 *   }
 *
 *   async deactivate(): Promise<PluginResult> {
 *     // Cleanup
 *     return { success: true }
 *   }
 * }
 * ```
 */
export interface IPlugin {
  /** Plugin manifest (loaded from plugin.json) */
  manifest: PluginManifest

  /**
   * Called when the plugin is activated by the core.
   * Use this to register hooks, initialize connections, etc.
   */
  activate(): Promise<PluginResult>

  /**
   * Called when the plugin is deactivated (uninstalled or disabled).
   * Use this to clean up resources, unsubscribe from hooks, etc.
   */
  deactivate(): Promise<PluginResult>

  /**
   * Called when a lifecycle hook is triggered.
   * Only hooks declared in manifest.hooks will be dispatched here.
   */
  onHook?(event: PluginEventPayload): Promise<PluginResult>
}
