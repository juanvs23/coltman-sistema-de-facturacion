import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import type { PluginResult, PluginSchema } from '@plugin-api/types'

const execAsync = promisify(exec)

/** Regex to extract model names from a Prisma schema string */
const MODEL_NAME_REGEX = /model\s+(\w+)\s*\{/g

/** Regex to strip generator/datasource blocks from plugin schemas */
const BLOCK_STRIP_REGEX = /^\s*(generator|datasource)\s+\w+\s*\{[^}]*\}\s*/gm

export type ReadFileFn = (path: string, encoding: 'utf-8') => Promise<string>
export type WriteFileFn = (path: string, data: string, encoding: 'utf-8') => Promise<void>
export type MkdirFn = (path: string, options: { recursive: boolean }) => Promise<void>
export type UnlinkFn = (path: string) => Promise<void>
export type RunCommand = (cmd: string) => Promise<{ stdout: string; stderr: string }>

export interface DataModelMigrationConfig {
  /** Absolute path to the core prisma/schema.prisma file */
  coreSchemaPath?: string
  /** Custom command runner (injectable for tests) */
  runCommand?: RunCommand
  /** File system helpers (injectable for tests) */
  readFile?: ReadFileFn
  writeFile?: WriteFileFn
  mkdir?: MkdirFn
  unlink?: UnlinkFn
}

const defaultRunCommand: RunCommand = async (cmd) => {
  const { stdout, stderr } = await execAsync(cmd)
  return { stdout, stderr }
}

const defaultReadFile: ReadFileFn = async (path, encoding) => {
  const { readFile } = await import('node:fs/promises')
  return readFile(path, encoding)
}

const defaultWriteFile: WriteFileFn = async (path, data, encoding) => {
  const { writeFile } = await import('node:fs/promises')
  return writeFile(path, data, encoding)
}

const defaultMkdir: MkdirFn = async (path, options) => {
  const { mkdir } = await import('node:fs/promises')
  return mkdir(path, options)
}

const defaultUnlink: UnlinkFn = async (path) => {
  const { unlink } = await import('node:fs/promises')
  return unlink(path)
}

export class DataModelRegistry {
  private schemas: Map<string, PluginSchema> = new Map()
  private coreSchemaPath: string
  private runCommand: RunCommand
  private readFile: ReadFileFn
  private writeFile: WriteFileFn
  private mkdir: MkdirFn
  private unlink: UnlinkFn

  constructor(config?: DataModelMigrationConfig) {
    this.coreSchemaPath = config?.coreSchemaPath ?? join(process.cwd(), 'prisma', 'schema.prisma')
    this.runCommand = config?.runCommand ?? defaultRunCommand
    this.readFile = config?.readFile ?? defaultReadFile
    this.writeFile = config?.writeFile ?? defaultWriteFile
    this.mkdir = config?.mkdir ?? defaultMkdir
    this.unlink = config?.unlink ?? defaultUnlink
  }

  async registerSchema(id: string, schema: string): Promise<PluginResult> {
    const sanitizedId = id.replace(/[^a-zA-Z0-9_]/g, '_')
    const expectedPrefix = `plugin_${sanitizedId}_`

    const modelNames: string[] = []
    let match: RegExpExecArray | null
    MODEL_NAME_REGEX.lastIndex = 0

    while ((match = MODEL_NAME_REGEX.exec(schema)) !== null) {
      modelNames.push(match[1])
    }

    if (modelNames.length === 0) {
      return {
        success: false,
        error: `El schema del plugin "${id}" no contiene ningún modelo.`
      }
    }

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

    this.schemas.set(id, { id, schema })
    return { success: true }
  }

  getSchema(id: string): PluginSchema | null {
    return this.schemas.get(id) ?? null
  }

  listSchemas(): PluginSchema[] {
    return Array.from(this.schemas.values())
  }

  async migrate(id: string): Promise<PluginResult<{ migrated: boolean; pluginId: string }>> {
    const schema = this.schemas.get(id)
    if (!schema) {
      return {
        success: false,
        error: `No schema registered for plugin "${id}". Call registerSchema() first.`
      }
    }

    const sanitizedId = id.replace(/[^a-zA-Z0-9_]/g, '_')
    const cleanPluginSchema = schema.schema.replace(BLOCK_STRIP_REGEX, '').trim()

    if (!cleanPluginSchema) {
      return {
        success: false,
        error: `Plugin "${id}" schema has no model definitions after sanitization.`
      }
    }

    try {
      const coreSchema = await this.readFile(this.coreSchemaPath, 'utf-8')
      const combined = `${coreSchema.trim()}\n\n// Plugin: ${id}\n${cleanPluginSchema}\n`

      const tmpDir = join(tmpdir(), 'plugin-migrations')
      const tmpFile = join(tmpDir, `schema-${sanitizedId}.prisma`)
      await this.mkdir(tmpDir, { recursive: true })
      await this.writeFile(tmpFile, combined, 'utf-8')

      await this.runCommand(`npx prisma db push --schema="${tmpFile}" --accept-data-loss`)

      await this.unlink(tmpFile).catch(() => {})

      return { success: true, data: { migrated: true, pluginId: id } }
    } catch (error) {
      return { success: false, error: `Migration failed for plugin "${id}": ${(error as Error).message}` }
    }
  }
}
