/**
 * Unit tests for BasicPrinterPlugin.
 *
 * Mocks net.Socket since we don't have a real printer.
 * Tests the plugin lifecycle, TCP connection management,
 * and delegation to formatReceipt/formatDrawerKick.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'events'

// ── Mock Socket ──────────────────────────────────────────────

class MockSocket extends EventEmitter {
  write = vi.fn((_data: Buffer, callback?: (err?: Error) => void) => {
    if (callback) callback()
    return true
  })
  destroy = vi.fn(() => {
    this.destroyed = true
    return this
  })
  removeListener = vi.fn()

  destroyed = false

  // Simulate a successful connect — triggers the connect listener
  _emitConnect(): void {
    this.emit('connect')
  }

  // Simulate a connection error — triggers the error listener
  _emitError(err: Error): void {
    this.emit('error', err)
  }

  // Add a non-event-emitter-style connect that the real net.Socket uses
  connect(_port: number, _host: string, callback?: () => void): this {
    // Store the callback — the test will call _emitConnect instead
    if (callback) {
      this.once('connect', callback)
    }
    return this
  }
}

// Track mock socket instances for inspection
const mockSocketInstances: MockSocket[] = []

// ── Module Mock ──────────────────────────────────────────────

vi.mock('net', () => {
  return {
    default: {
      Socket: vi.fn().mockImplementation(() => {
        const socket = new MockSocket()
        mockSocketInstances.push(socket)
        return socket as unknown as import('net').Socket
      })
    }
  }
})

// ── Test Suite ───────────────────────────────────────────────

describe('BasicPrinterPlugin', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let BasicPrinterPluginClass: any

  beforeEach(async () => {
    mockSocketInstances.length = 0
    vi.clearAllMocks()

    // Dynamic import so the net mock takes effect
    const mod = await import('../BasicPrinterPlugin')
    BasicPrinterPluginClass = mod.BasicPrinterPlugin
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ── Plugin Identity ────────────────────────────────────────

  describe('Plugin identity (manifest + contracts)', () => {
    it('declares manifest with id "basic-printer" and requiresLicense false', () => {
      const instance = new BasicPrinterPluginClass()
      expect(instance.manifest).toBeDefined()
      expect(instance.manifest.id).toBe('basic-printer')
      expect(instance.manifest.requiresLicense).toBe(false)
      expect(instance.manifest.visibility).toBe('free')
    })

    it('implements IBasicPrinter identity fields (type, displayName)', () => {
      const instance = new BasicPrinterPluginClass()
      expect(instance.type).toBe('basic-printer')
      expect(instance.displayName).toBeTruthy()
      expect(typeof instance.displayName).toBe('string')
    })

    it('exposes all 4 IBasicPrinter methods as functions', () => {
      const instance = new BasicPrinterPluginClass()
      expect(typeof instance.testConnection).toBe('function')
      expect(typeof instance.printReceipt).toBe('function')
      expect(typeof instance.getStatus).toBe('function')
      expect(typeof instance.openDrawer).toBe('function')
    })

    it('does NOT expose printInvoice (distinguishing from IFiscalPrinter)', () => {
      const instance = new BasicPrinterPluginClass()
      expect(instance.printInvoice).toBeUndefined()
    })
  })

  // ── Activate / Deactivate ──────────────────────────────────

  describe('activate (lifecycle + TCP connect)', () => {
    it('creates a net.Socket and connects to localhost:9100', async () => {
      const instance = new BasicPrinterPluginClass()
      const activatePromise = instance.activate()

      // Verify a socket was created
      expect(mockSocketInstances.length).toBe(1)

      // Emit connect to resolve the promise
      mockSocketInstances[0]._emitConnect()

      const result = await activatePromise
      expect(result.success).toBe(true)
    })

    it('returns success: false when TCP connection fails', async () => {
      const instance = new BasicPrinterPluginClass()
      const activatePromise = instance.activate()

      expect(mockSocketInstances.length).toBe(1)

      // Emit error instead of connect
      mockSocketInstances[0]._emitError(new Error('ECONNREFUSED'))

      const result = await activatePromise
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('deactivate (lifecycle + TCP disconnect)', () => {
    it('destroys the socket on deactivate', async () => {
      const instance = new BasicPrinterPluginClass()
      const activatePromise = instance.activate()
      mockSocketInstances[0]._emitConnect()
      await activatePromise

      const result = await instance.deactivate()
      expect(result.success).toBe(true)
      expect(mockSocketInstances[0].destroy).toHaveBeenCalled()
    })

    it('succeeds even if no socket was created (idempotent)', async () => {
      const instance = new BasicPrinterPluginClass()
      const result = await instance.deactivate()
      expect(result.success).toBe(true)
    })
  })

  // ── Printer Operations ─────────────────────────────────────

  describe('printReceipt', () => {
    it('writes formatted receipt buffer to the socket', async () => {
      const instance = new BasicPrinterPluginClass()
      const activatePromise = instance.activate()
      mockSocketInstances[0]._emitConnect()
      await activatePromise

      const receiptData = {
        header: ['Test Store'],
        lines: [{ type: 'text' as const, text: 'Item 1' }],
        footer: ['Thank you']
      }

      const result = await instance.printReceipt(receiptData)
      expect(result.success).toBe(true)
      expect(mockSocketInstances[0].write).toHaveBeenCalledTimes(1)
    })

    it('returns error when socket is not connected', async () => {
      const instance = new BasicPrinterPluginClass()
      const receiptData = {
        header: ['Test'],
        lines: [{ type: 'text' as const, text: 'Item' }],
        footer: []
      }

      const result = await instance.printReceipt(receiptData)
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('openDrawer', () => {
    it('writes drawer kick buffer to the socket', async () => {
      const instance = new BasicPrinterPluginClass()
      const activatePromise = instance.activate()
      mockSocketInstances[0]._emitConnect()
      await activatePromise

      const result = await instance.openDrawer()
      expect(result.success).toBe(true)
      expect(mockSocketInstances[0].write).toHaveBeenCalledTimes(1)
    })

    it('returns error when socket is not connected', async () => {
      const instance = new BasicPrinterPluginClass()
      const result = await instance.openDrawer()
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('getStatus', () => {
    it('returns online: true when socket is connected', async () => {
      const instance = new BasicPrinterPluginClass()
      const activatePromise = instance.activate()
      mockSocketInstances[0]._emitConnect()
      await activatePromise

      const result = await instance.getStatus()
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        online: true,
        paperOut: false,
        drawerOpen: false
      })
    })

    it('returns online: false when socket is not connected', async () => {
      const instance = new BasicPrinterPluginClass()
      const result = await instance.getStatus()
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        online: false,
        paperOut: false,
        drawerOpen: false
      })
    })
  })

  describe('testConnection', () => {
    it('returns success when socket is connected (active)', async () => {
      const instance = new BasicPrinterPluginClass()
      const activatePromise = instance.activate()
      mockSocketInstances[0]._emitConnect()
      await activatePromise

      const result = await instance.testConnection()
      expect(result.success).toBe(true)
    })

    it('returns error when socket is not connected', async () => {
      const instance = new BasicPrinterPluginClass()
      const result = await instance.testConnection()
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })
})
