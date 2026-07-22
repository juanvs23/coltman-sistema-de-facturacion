/**
 * UI Registry — manages plugin-injected user interface elements.
 *
 * Plugins can register:
 * - Sidebar menu items
 * - Route entries (pages)
 * - Settings panel tabs
 *
 * The registry emits change notifications via `onChange` callbacks,
 * which in Phase 3 will bridge to the renderer via IPC.
 *
 * @packageDocumentation
 */

import type { UiMenuItem, UiRoute, UiSettingsTab } from '@plugin-api/types'
import type { IPluginUI, UiRegistryChangeCallback } from '@plugin-api/contracts/IPluginUI'

/**
 * UiRegistry — stores and manages plugin UI extensions.
 *
 * @example
 * ```ts
 * const ui = new UiRegistry()
 *
 * ui.addMenuItem({
 *   id: 'fiscal',
 *   label: 'Fiscal',
 *   icon: 'printer',
 *   route: '/plugins/fiscal',
 *   permission: 'ADMIN'
 * })
 *
 * // Subscribe to changes (for IPC bridge)
 * ui.onChange(() => console.log('UI registry updated'))
 * ```
 */
export class UiRegistry implements IPluginUI {
  private _menuItems: UiMenuItem[] = []
  private _routes: UiRoute[] = []
  private _settingsTabs: UiSettingsTab[] = []
  private changeCallbacks: Set<UiRegistryChangeCallback> = new Set()

  get menuItems(): readonly UiMenuItem[] {
    return this._menuItems
  }

  get routes(): readonly UiRoute[] {
    return this._routes
  }

  get settingsTabs(): readonly UiSettingsTab[] {
    return this._settingsTabs
  }

  // ─── Menu Items ────────────────────────────────────────────

  /**
   * Register a sidebar menu item.
   * Duplicate ids are silently ignored.
   */
  addMenuItem(item: UiMenuItem): void {
    if (this._menuItems.some((existing) => existing.id === item.id)) {
      return
    }
    this._menuItems.push(item)
    this.notifyChange()
  }

  /**
   * Remove a previously registered menu item by id.
   */
  removeMenuItem(id: string): void {
    const idx = this._menuItems.findIndex((item) => item.id === id)
    if (idx !== -1) {
      this._menuItems.splice(idx, 1)
      this.notifyChange()
    }
  }

  // ─── Routes ────────────────────────────────────────────────

  /**
   * Register a route.
   * Duplicate paths are silently ignored.
   */
  addRoute(route: UiRoute): void {
    if (this._routes.some((existing) => existing.path === route.path)) {
      return
    }
    this._routes.push(route)
    this.notifyChange()
  }

  /**
   * Remove a previously registered route by path.
   */
  removeRoute(path: string): void {
    const idx = this._routes.findIndex((route) => route.path === path)
    if (idx !== -1) {
      this._routes.splice(idx, 1)
      this.notifyChange()
    }
  }

  // ─── Settings Tabs ─────────────────────────────────────────

  /**
   * Register a settings tab.
   * Duplicate ids are silently ignored.
   */
  addSettingsTab(tab: UiSettingsTab): void {
    if (this._settingsTabs.some((existing) => existing.id === tab.id)) {
      return
    }
    this._settingsTabs.push(tab)
    this.notifyChange()
  }

  /**
   * Remove a previously registered settings tab by id.
   */
  removeSettingsTab(id: string): void {
    const idx = this._settingsTabs.findIndex((tab) => tab.id === id)
    if (idx !== -1) {
      this._settingsTabs.splice(idx, 1)
      this.notifyChange()
    }
  }

  // ─── Change Subscriptions ──────────────────────────────────

  /**
   * Subscribe to registry changes (used internally for IPC bridge).
   */
  onChange(callback: UiRegistryChangeCallback): void {
    this.changeCallbacks.add(callback)
  }

  /**
   * Unsubscribe from registry changes.
   */
  offChange(callback: UiRegistryChangeCallback): void {
    this.changeCallbacks.delete(callback)
  }

  // ─── Private ───────────────────────────────────────────────

  /**
   * Notify all change subscribers.
   * In Phase 3, this will also send IPC messages to the renderer.
   */
  private notifyChange(): void {
    for (const callback of this.changeCallbacks) {
      try {
        callback()
      } catch (error) {
        console.error('UiRegistry onChange callback failed:', error)
      }
    }
  }
}
