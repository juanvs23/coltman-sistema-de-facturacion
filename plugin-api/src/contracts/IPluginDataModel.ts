/**
 * Plugin Data Model — contract for extending the database schema.
 *
 * Plugins can declare additional Prisma models that are validated
 * and migrated alongside the core schema. All plugin tables MUST
 * use the namespace prefix `plugin_<id>_` to prevent collisions.
 *
 * @example
 * ```ts
 * const schema = `
 *   model plugin_fiscal_printer_Log {
 *     id        Int      @id @default(autoincrement())
 *     message   String
 *     createdAt DateTime @default(now())
 *   }
 * `
 * const result = await dataModelRegistry.registerSchema(schema)
 * ```
 */

import type { PluginResult } from '../types'

/**
 * Contract for registering and managing plugin data models.
 */
export interface IPluginDataModel {
  /**
   * Register a Prisma schema for this plugin.
   * The schema string MUST contain only models prefixed with
   * `plugin_<id>_` or registration will fail.
   *
   * @param schema — Raw Prisma schema string (one or more model blocks)
   * @returns PluginResult — success if valid, error with message if invalid
   */
  registerSchema(schema: string): Promise<PluginResult>
}
