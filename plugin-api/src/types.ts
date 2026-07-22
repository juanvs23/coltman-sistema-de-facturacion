/**
 * Plugin API — Shared types
 *
 * These types define the contract between the core POS and external plugins.
 * Plugin authors import these to build compatible plugins.
 *
 * @packageDocumentation
 * @module @sistema-facturacion/plugin-api
 */

/** Plugin visibility level — controls who can install/use the plugin */
export type PluginVisibility = 'free' | 'premium' | 'internal'

/** Runtime platform the plugin targets */
export type PluginTarget = 'main' | 'renderer' | 'both'

/** Lifecycle hook names a plugin can subscribe to */
export type PluginHook =
  | 'app:ready'
  | 'app:before-quit'
  | 'sale:completed'
  | 'sale:cancelled'
  | 'product:created'
  | 'product:updated'
  | 'cash:opened'
  | 'cash:closed'
  | 'printer:before-print'
  | 'printer:after-print'

/** Plugin manifest as declared in plugin.json */
export interface PluginManifest {
  /** Unique plugin identifier (e.g. "fiscal-printer", "seniat") */
  id: string
  /** Human-readable name */
  name: string
  /** Semver version */
  version: string
  /** Short description */
  description: string
  /** Author name or organization */
  author: string
  /** Visibility level */
  visibility: PluginVisibility
  /** Runtime target */
  target: PluginTarget
  /** Hooks this plugin subscribes to */
  hooks: PluginHook[]
  /** POS core version requirement (semver range) */
  coreVersion?: string
  /** License key required if premium */
  requiresLicense?: boolean
}

/** Runtime info about an installed plugin */
export interface PluginInfo {
  id: string
  name: string
  version: string
  description: string
  author: string
  enabled: boolean
  visibility: PluginVisibility
  target: PluginTarget
  hooks: PluginHook[]
}

/** Result of a plugin lifecycle operation */
export interface PluginResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

/** Generic event payload for hook subscriptions */
export interface PluginEventPayload {
  hook: PluginHook
  /** ISO timestamp of the event */
  timestamp: string
  /** Domain-specific data */
  data: Record<string, unknown>
}

// ─── Hook Priority ──────────────────────────────────────────

/** Numeric priority for hook execution (lower = executed first) */
export type HookPriority = number

// ─── UI Extension Types ─────────────────────────────────────

/** A menu item that a plugin can inject into the POS sidebar */
export interface UiMenuItem {
  /** Unique item identifier (e.g. "fiscal") */
  id: string
  /** Display label (e.g. "Fiscal") */
  label: string
  /** Icon name or path */
  icon: string
  /** Route path to navigate to on click */
  route: string
  /** Optional permission required to see this item */
  permission?: string
}

/** A route that a plugin can register in the POS router */
export interface UiRoute {
  /** Route path (e.g. "/plugins/fiscal") */
  path: string
  /** Component identifier for lazy loading */
  component: string
  /** Optional permission required to access this route */
  permission?: string
}

/** A settings tab that a plugin can inject into the Settings panel */
export interface UiSettingsTab {
  /** Tab identifier (e.g. "fiscal-config") */
  id: string
  /** Display label (e.g. "Configuración Fiscal") */
  label: string
  /** Component identifier for lazy loading */
  component: string
}

// ─── Data Model Types ───────────────────────────────────────

/** Schema definition registered by a plugin */
export interface PluginSchema {
  /** Plugin id that owns this schema */
  id: string
  /** Raw Prisma schema string */
  schema: string
}
