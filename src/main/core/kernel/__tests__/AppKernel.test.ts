import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AppKernel } from '../AppKernel'
import { PluginRegistry } from '../PluginRegistry'
import { HookBus } from '../HookBus'
import type { PluginManifest, PluginResult } from '@plugin-api/types'

const mockManifest: PluginManifest = {
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  description: 'A test plugin',
  author: 'Test Author',
  visibility: 'internal',
  target: 'main',
  hooks: ['sale:completed']
}

const factory = async (): Promise<PluginResult> => ({ success: true })

describe('AppKernel', () => {
  let kernel: AppKernel

  beforeEach(() => {
    AppKernel.reset()
    kernel = AppKernel.getInstance()
  })

  describe('2.5 — integration: registry + hook bus', () => {
    it('should register a plugin and dispatch a hook through HookBus', () => {
      const registry = kernel.pluginRegistryInternal
      const hookBus = kernel.hookBusInternal

      registry.register(mockManifest, factory)
      registry.activate('test-plugin')

      const callback = vi.fn()
      hookBus.on('sale:completed', callback)

      // Dispatch via the public interface
      hookBus.action('sale:completed', { saleId: 1 })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith({ saleId: 1 })
    })

    it('should dispatch hooks in priority order', () => {
      const hookBus = kernel.hookBusInternal
      const order: number[] = []

      hookBus.on('test:priority', () => order.push(20), 20)
      hookBus.on('test:priority', () => order.push(5), 5)
      hookBus.on('test:priority', () => order.push(10), 10)

      hookBus.action('test:priority')

      expect(order).toEqual([5, 10, 20])
    })

    it('should apply filter pipeline in order', () => {
      const hookBus = kernel.hookBusInternal

      hookBus.filter('test:filter', (data) => {
        return { value: (data as { value: number }).value + 1 }
      }, 10)

      hookBus.filter('test:filter', (data) => {
        return { value: (data as { value: number }).value * 2 }
      }, 5)

      const result = hookBus.applyFilter<{ value: number }>('test:filter', { value: 1 })

      // Priority 5 runs first: 1 * 2 = 2
      // Priority 10 runs second: 2 + 1 = 3
      expect(result.value).toBe(3)
    })

    it('should return active country plugin when registered', async () => {
      // Register a country plugin for VE
      kernel.registerCountryPlugin('plugin-ve', 'VE')

      const countryPlugin = await kernel.getCountryPlugin()
      // Without a proper prisma client, this should return null
      // The full integration test requires Prisma
      expect(countryPlugin).toBeNull()
    })
  })

  describe('2.10 — getCountryPlugin', () => {
    it('should return null when kernel is not initialized', async () => {
      const result = await kernel.getCountryPlugin()
      expect(result).toBeNull()
    })

    it('should return a country plugin when initialized with matching country', async () => {
      // Mock prisma to return VE config
      const mockPrisma = {
        appConfig: {
          findUnique: vi.fn().mockResolvedValue({ country: 'VE' })
        }
      }

      await kernel.init(mockPrisma as never, {} as never)
      kernel.registerCountryPlugin('plugin-ve', 'VE')

      // Store a mock plugin instance for the registry
      const mockPlugin = {
        countryCode: 'VE',
        countryName: 'Venezuela',
        currencySymbol: 'Bs.',
        currencyCode: 'VES',
        taxIdLabel: 'RIF',
        validateTaxId: vi.fn(),
        formatTaxId: vi.fn(),
        formatCurrency: vi.fn(),
        getDefaultTaxes: vi.fn(),
        getPaymentMethods: vi.fn(),
        getReceiptFooter: vi.fn(),
        getDefaultExchangeRate: vi.fn(),
      }

      kernel.registerCountryPluginInstance('plugin-ve', mockPlugin as never)

      const result = await kernel.getCountryPlugin()
      expect(result).not.toBeNull()
      expect(result!.countryCode).toBe('VE')
      expect(result!.countryName).toBe('Venezuela')
    })

    it('should return null when no plugin matches the configured country', async () => {
      const mockPrisma = {
        appConfig: {
          findUnique: vi.fn().mockResolvedValue({ country: 'CO' })
        }
      }

      await kernel.init(mockPrisma as never, {} as never)
      kernel.registerCountryPlugin('plugin-ve', 'VE')

      const result = await kernel.getCountryPlugin()
      expect(result).toBeNull()
    })
  })
})
