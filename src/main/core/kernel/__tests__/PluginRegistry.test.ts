import { describe, it, expect, beforeEach } from 'vitest'
import { PluginRegistry } from '../PluginRegistry'
import type { PluginManifest, PluginResult } from '@plugin-api/types'

describe('PluginRegistry', () => {
  let registry: PluginRegistry

  const baseManifest: PluginManifest = {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'A test plugin',
    author: 'Test Author',
    visibility: 'internal',
    target: 'main',
    hooks: []
  }

  const factory = async (): Promise<PluginResult> => ({ success: true })

  beforeEach(() => {
    registry = new PluginRegistry()
    vi.restoreAllMocks()
  })

  describe('registration', () => {
    it('should register a plugin and make it available via list()', () => {
      registry.register(baseManifest, factory)
      const plugins = registry.list()
      expect(plugins).toHaveLength(1)
      expect(plugins[0].id).toBe('test-plugin')
    })

    it('should reject duplicate plugin id with an error', () => {
      registry.register(baseManifest, factory)
      expect(() => registry.register(baseManifest, factory)).toThrow(/duplicate|ya está|already/i)
    })

    it('should not add duplicate to the internal list', () => {
      registry.register(baseManifest, factory)
      try {
        registry.register(baseManifest, factory)
      } catch {
        // expected
      }
      expect(registry.list()).toHaveLength(1)
    })
  })

  describe('lifecycle', () => {
    it('should return false for isActive before activation', () => {
      registry.register(baseManifest, factory)
      expect(registry.isActive('test-plugin')).toBe(false)
    })

    it('should change isActive to true after activation', () => {
      registry.register(baseManifest, factory)
      registry.activate('test-plugin')
      expect(registry.isActive('test-plugin')).toBe(true)
    })

    it('should change isActive to false after deactivation', () => {
      registry.register(baseManifest, factory)
      registry.activate('test-plugin')
      registry.deactivate('test-plugin')
      expect(registry.isActive('test-plugin')).toBe(false)
    })

    it('should reflect active state in list() after activate', () => {
      registry.register(baseManifest, factory)
      registry.activate('test-plugin')
      const plugins = registry.list()
      expect(plugins[0].enabled).toBe(true)
    })
  })

  describe('query', () => {
    it('should return null for getPlugin with non-existent id', () => {
      expect(registry.getPlugin('nonexistent')).toBeNull()
    })

    it('should return PluginInfo for getPlugin with valid id', () => {
      registry.register(baseManifest, factory)
      const info = registry.getPlugin('test-plugin')
      expect(info).not.toBeNull()
      expect(info!.id).toBe('test-plugin')
      expect(info!.name).toBe('Test Plugin')
      expect(info!.version).toBe('1.0.0')
    })
  })

  describe('error handling', () => {
    it('should throw when activating a non-existent plugin', () => {
      expect(() => registry.activate('nonexistent')).toThrow()
    })

    it('should throw when deactivating a non-existent plugin', () => {
      expect(() => registry.deactivate('nonexistent')).toThrow()
    })
  })
})
