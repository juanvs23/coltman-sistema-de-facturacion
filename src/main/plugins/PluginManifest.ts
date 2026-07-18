import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { PluginManifest } from '@plugin-api/types'

/**
 * Reads and validates a plugin.json manifest from a plugin directory.
 */
export function loadPluginManifest(pluginDir: string): PluginManifest | null {
  const manifestPath = join(pluginDir, 'plugin.json')
  if (!existsSync(manifestPath)) {
    return null
  }

  try {
    const raw = readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(raw) as Partial<PluginManifest>

    // Validate required fields
    const required = ['id', 'name', 'version', 'description', 'author'] as const
    for (const field of required) {
      if (!manifest[field]) {
        console.error(`Plugin manifest missing required field: ${field} in ${pluginDir}`)
        return null
      }
    }

    return manifest as PluginManifest
  } catch (error) {
    console.error(`Failed to parse plugin manifest in ${pluginDir}:`, error)
    return null
  }
}
