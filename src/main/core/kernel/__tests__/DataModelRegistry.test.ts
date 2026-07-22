import { describe, it, expect, beforeEach } from 'vitest'
import { DataModelRegistry } from '../DataModelRegistry'

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
      // Note: hyphens in plugin id are replaced with underscores for model names
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

  describe('migrate stub', () => {
    it('should return success result with message indicating stub', async () => {
      const result = await registry.migrate('test-plugin')
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })
})
