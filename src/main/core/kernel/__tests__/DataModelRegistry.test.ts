import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DataModelRegistry } from '../DataModelRegistry'
import type { RunCommand, ReadFileFn, WriteFileFn, MkdirFn, UnlinkFn } from '../DataModelRegistry'

describe('DataModelRegistry', () => {
  let registry: DataModelRegistry

  beforeEach(() => {
    registry = new DataModelRegistry()
  })

  describe('namespace validation', () => {
    it('should reject schema with model that lacks plugin_<id>_ prefix', async () => {
      const schema = `
        model UserSettings {
          id Int @id @default(autoincrement())
          key   String
          value String
        }
      `
      const result = await registry.registerSchema('test-plugin', schema)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error!.toLowerCase()).toContain('prefijo')
    })

    it('should accept schema with correctly prefixed model', async () => {
      const schema = `
        model plugin_test_plugin_Settings {
          id    Int    @id @default(autoincrement())
          key   String
          value String
        }
      `
      const result = await registry.registerSchema('test-plugin', schema)
      expect(result.success).toBe(true)
    })

    it('should reject if any model in multi-model schema lacks prefix', async () => {
      const schema = `
        model plugin_test_plugin_Log {
          id  Int      @id @default(autoincrement())
          msg String
        }

        model OrphanTable {
          id  Int    @id @default(autoincrement())
          val String
        }
      `
      const result = await registry.registerSchema('test-plugin', schema)
      expect(result.success).toBe(false)
      expect(result.error!.toLowerCase()).toContain('prefijo')
    })

    it('should accept multiple models all with correct prefix', async () => {
      const schema = `
        model plugin_test_plugin_Log {
          id  Int      @id @default(autoincrement())
          msg String
        }

        model plugin_test_plugin_Config {
          id    Int    @id @default(autoincrement())
          key   String @unique
          value String
        }
      `
      const result = await registry.registerSchema('test-plugin', schema)
      expect(result.success).toBe(true)
    })
  })

  describe('schema storage', () => {
    it('should store the schema after valid registration', async () => {
      const schema = `
        model plugin_test_plugin_Settings {
          id Int @id @default(autoincrement())
          key String
        }
      `
      await registry.registerSchema('test-plugin', schema)
      const stored = registry.getSchema('test-plugin')
      expect(stored).not.toBeNull()
      expect(stored!.id).toBe('test-plugin')
    })

    it('should return null for non-existent plugin schema', () => {
      expect(registry.getSchema('nonexistent')).toBeNull()
    })
  })

  describe('migrate', () => {
    const mockFs = () => ({
      readFile: vi.fn().mockResolvedValue('datasource db { provider = "sqlite" url = "file:./dev.db" }') as ReadFileFn,
      writeFile: vi.fn().mockResolvedValue(undefined) as WriteFileFn,
      mkdir: vi.fn().mockResolvedValue(undefined) as MkdirFn,
      unlink: vi.fn().mockResolvedValue(undefined) as UnlinkFn,
      runCommand: vi.fn().mockResolvedValue({ stdout: 'OK', stderr: '' }) as RunCommand
    })

    it('should return error when no schema is registered for the plugin', async () => {
      const result = await registry.migrate('unknown-plugin')
      expect(result.success).toBe(false)
      expect(result.error).toContain('No schema registered')
    })

    it('should combine core schema with plugin schema and execute prisma db push', async () => {
      const fs = mockFs()
      const schema = `
        model plugin_test_plugin_Settings {
          id    Int    @id @default(autoincrement())
          key   String
          value String
        }
      `

      const reg = new DataModelRegistry({
        coreSchemaPath: '/tmp/mock-schema.prisma',
        ...fs
      })

      await reg.registerSchema('test-plugin', schema)
      const result = await reg.migrate('test-plugin')

      expect(result.success).toBe(true)
      expect(result.data?.migrated).toBe(true)
      expect(result.data?.pluginId).toBe('test-plugin')
      expect(fs.runCommand).toHaveBeenCalledTimes(1)
      const cmd = (fs.runCommand as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
      expect(cmd).toContain('prisma db push')
      expect(cmd).toContain('--accept-data-loss')
      expect(cmd).toContain('schema-')
      expect(fs.readFile).toHaveBeenCalledWith('/tmp/mock-schema.prisma', 'utf-8')
      expect(fs.writeFile).toHaveBeenCalledTimes(1)
    })

    it('should sanitize generator/datasource blocks from plugin schema', async () => {
      const fs = mockFs()
      const schema = `
        generator client {
          provider = "prisma-client-js"
        }

        model plugin_test_plugin_Settings {
          id    Int    @id @default(autoincrement())
          key   String
        }
      `

      const reg = new DataModelRegistry({ coreSchemaPath: '/tmp/mock-schema.prisma', ...fs })

      await reg.registerSchema('test-plugin', schema)
      const result = await reg.migrate('test-plugin')
      expect(result.success).toBe(true)
      expect(result.data?.migrated).toBe(true)

      const writtenContent = (fs.writeFile as ReturnType<typeof vi.fn>).mock.calls[0][1] as string
      expect(writtenContent).not.toContain('generator')
      expect(writtenContent).toContain('plugin_test_plugin_Settings')
    })

    it('should return error when prisma command fails', async () => {
      const fs = { ...mockFs(), runCommand: vi.fn().mockRejectedValue(new Error('Prisma CLI not found')) as RunCommand }
      const schema = `
        model plugin_test_plugin_Settings {
          id    Int    @id @default(autoincrement())
          key   String
        }
      `

      const reg = new DataModelRegistry({ coreSchemaPath: '/tmp/mock-schema.prisma', ...fs })

      await reg.registerSchema('test-plugin', schema)
      const result = await reg.migrate('test-plugin')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Prisma CLI not found')
    })

    it('should return error when core schema file cannot be read', async () => {
      const fs = { ...mockFs(), readFile: vi.fn().mockRejectedValue(new Error('ENOENT: schema.prisma not found')) as ReadFileFn }
      const reg = new DataModelRegistry({
        coreSchemaPath: '/nonexistent/schema.prisma',
        ...fs
      })

      const schema = `
        model plugin_test_plugin_Settings {
          id Int @id @default(autoincrement())
          key String
        }
      `
      await reg.registerSchema('test-plugin', schema)
      const result = await reg.migrate('test-plugin')
      expect(result.success).toBe(false)
      expect(result.error).toContain('ENOENT')
    })
  })
})
