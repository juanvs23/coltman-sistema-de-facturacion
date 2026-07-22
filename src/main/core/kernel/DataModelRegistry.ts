/**
 * Data Model Registry — manages plugin data model schemas.
 *
 * Plugins can extend the database schema by registering Prisma models.
 * All plugin tables MUST use the namespace `plugin_<id>_` to prevent
 * collisions between plugins.
 *
 * @packageDocumentation
 */

import type { PluginResult, PluginSchema } from '@plugin-api/types'

/** Regex to extract model names from a Prisma schema string */
const MODEL_NAME_REGEX = /model\s+(\w+)\s*\{/g

/**
 * DataModelRegistry — validates, stores, and (in future phases) migrates
 * plugin data models.
 *
 * @example
 * ```ts
 * const registry = new DataModelRegistry()
 *
 * // Valid schema with correct prefix
 * const valid = await registry.registerSchema('my-plugin', `
 *   model plugin_my_plugin_Settings {
 *     id Int @id @default(autoincrement())
 *     key String
 *   }
 * `)
 * // valid.success === true
 *
 * // Invalid schema — missing prefix
 * const invalid = await registry.registerSchema('my-plugin', `
 *   model OrphanTable { id Int @id }
 * `)
 * // invalid.success === false, invalid.error contains explanation
 * ```
 */
export class DataModelRegistry {
  /** Stored schemas per plugin id */
  private schemas: Map<string, PluginSchema> = new Map()

  /**
   * Register and validate a plugin's Prisma schema.
   *
   * Validation rules:
   * - All model names MUST start with `plugin_<id>_`
   * - At least one model MUST be declared
   *
   * @param id - Plugin identifier (used to build the expected prefix)
   * @param schema - Raw Prisma schema string
   * @returns PluginResult — success if valid, error with message if not
   */
  async registerSchema(id: string, schema: string): Promise<PluginResult> {
    // Sanitize id: replace characters invalid in Prisma model names (e.g. hyphens)
    // with underscores so the namespace prefix is a valid Prisma identifier
    const sanitizedId = id.replace(/[^a-zA-Z0-9_]/g, '_')
    const expectedPrefix = `plugin_${sanitizedId}_`

    // Extract all model names from the schema
    const modelNames: string[] = []
    let match: RegExpExecArray | null
    MODEL_NAME_REGEX.lastIndex = 0 // Reset regex state

    while ((match = MODEL_NAME_REGEX.exec(schema)) !== null) {
      modelNames.push(match[1])
    }

    if (modelNames.length === 0) {
      return {
        success: false,
        error: `El schema del plugin "${id}" no contiene ningún modelo.`
      }
    }

    // Check each model has the required prefix
    const invalidModels = modelNames.filter(
      (name) => !name.startsWith(expectedPrefix)
    )

    if (invalidModels.length > 0) {
      return {
        success: false,
        error:
          `Los siguientes modelos del plugin "${id}" no tienen el prefijo requerido ` +
          `"${expectedPrefix}": ${invalidModels.join(', ')}. ` +
          `Todos los modelos de un plugin deben comenzar con "${expectedPrefix}".`
      }
    }

    // Store the validated schema
    this.schemas.set(id, { id, schema })
    return { success: true }
  }

  /**
   * Get a stored plugin schema.
   *
   * @param id - Plugin identifier
   * @returns PluginSchema or null if not found
   */
  getSchema(id: string): PluginSchema | null {
    return this.schemas.get(id) ?? null
  }

  /**
   * List all registered schemas.
   */
  listSchemas(): PluginSchema[] {
    return Array.from(this.schemas.values())
  }

  /**
   * Stub: runs migration for a plugin's schema.
   *
   * Phase 4 will implement actual Prisma migration execution.
   *
   * @param id - Plugin identifier
   * @returns PluginResult with migration info
   */
  async migrate(id: string): Promise<PluginResult<{ migrated: boolean; pluginId: string }>> {
    return {
      success: true,
      data: {
        migrated: false,
        pluginId: id
      }
    }
  }
}
