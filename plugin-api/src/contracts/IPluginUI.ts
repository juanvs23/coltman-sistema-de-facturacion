/**
 * Plugin UI — contract for extending the POS user interface.
 *
 * Plugins can inject menu items into the sidebar, register full
 * routes (pages), and add configuration tabs to the Settings panel.
 *
 * The core renderer subscribes to UiRegistry changes via IPC and
 * renders registered UI elements using React.lazy() + Suspense.
 *
 * @example
 * ```ts
 * uiRegistry.addMenuItem({
 *   id: 'fiscal',
 *   label: 'Fiscal',
 *   icon: 'printer',
 *   route: '/plugins/fiscal',
 *   permission: 'ADMIN'
 * })
 *
 * uiRegistry.addRoute({
 *   path: '/plugins/fiscal',
 *   component: 'FiscalPage'
 * })
 *
 * uiRegistry.addSettingsTab({
 *   id: 'fiscal-config',
 *   label: 'Configuración Fiscal',
 *   component: 'FiscalSettings'
 * })
 * ```
 */

import type { UiMenuItem, UiRoute, UiSettingsTab } from '../types'

/** Callback fired when the registry changes (for IPC bridge) */
export type UiRegistryChangeCallback = () => void

/**
 * Contract for extending the POS user interface.
 */
export interface IPluginUI {
  /** All registered menu items */
  readonly menuItems: readonly UiMenuItem[]

  /** All registered routes */
  readonly routes: readonly UiRoute[]

  /** All registered settings tabs */
  readonly settingsTabs: readonly UiSettingsTab[]

  /**
   * Register a sidebar menu item.
   * Duplicate ids are silently ignored.
   */
  addMenuItem(item: UiMenuItem): void

  /**
   * Remove a previously registered menu item by id.
   */
  removeMenuItem(id: string): void

  /**
   * Register a route.
   * Duplicate paths are silently ignored.
   */
  addRoute(route: UiRoute): void

  /**
   * Remove a previously registered route by path.
   */
  removeRoute(path: string): void

  /**
   * Register a settings tab.
   * Duplicate ids are silently ignored.
   */
  addSettingsTab(tab: UiSettingsTab): void

  /**
   * Remove a previously registered settings tab by id.
   */
  removeSettingsTab(id: string): void

  /**
   * Subscribe to registry changes (used internally for IPC bridge).
   */
  onChange(callback: UiRegistryChangeCallback): void

  /**
   * Unsubscribe from registry changes.
   */
  offChange(callback: UiRegistryChangeCallback): void
}
