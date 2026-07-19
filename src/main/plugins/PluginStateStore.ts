import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

interface PluginStateEntry {
  active: boolean
  installedAt?: string
}

type PluginStateMap = Record<string, PluginStateEntry>

/**
 * Gestiona el archivo JSON de estado de plugins.
 *
 * Ubicación: `{userData}/plugins/state.json`
 */
export class PluginStateStore {
  private filePath: string

  constructor() {
    const pluginsDir = join(app.getPath('userData'), 'plugins')
    if (!existsSync(pluginsDir)) {
      mkdirSync(pluginsDir, { recursive: true })
    }
    this.filePath = join(pluginsDir, 'state.json')
  }

  /** Lee todos los estados */
  getAll(): PluginStateMap {
    try {
      if (!existsSync(this.filePath)) return {}
      const raw = readFileSync(this.filePath, 'utf-8')
      return JSON.parse(raw) as PluginStateMap
    } catch {
      return {}
    }
  }

  /** Obtiene el estado de un plugin específico */
  get(id: string): PluginStateEntry | null {
    const all = this.getAll()
    return all[id] ?? null
  }

  /** Guarda o actualiza un plugin */
  save(id: string, entry: PluginStateEntry): void {
    const all = this.getAll()
    all[id] = entry
    writeFileSync(this.filePath, JSON.stringify(all, null, 2), 'utf-8')
  }

  /** Activa/desactiva un plugin */
  toggleActive(id: string): PluginStateEntry {
    const current = this.get(id)
    const active = !current?.active
    const entry: PluginStateEntry = {
      active,
      installedAt: current?.installedAt ?? new Date().toISOString()
    }
    this.save(id, entry)
    return entry
  }

  /** Verifica si un plugin está activo (bundled plugins siempre activos por defecto) */
  isActive(id: string, defaultActive = true): boolean {
    const entry = this.get(id)
    if (!entry) return defaultActive
    return entry.active
  }
}
