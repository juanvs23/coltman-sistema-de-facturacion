import { describe, it, expect, beforeEach } from 'vitest'
import { HookBus } from '../HookBus'

describe('HookBus', () => {
  let hookBus: HookBus

  beforeEach(() => {
    hookBus = new HookBus()
  })

  describe('action dispatch with priority', () => {
    it('should call subscribers in ascending priority order', () => {
      const executionOrder: number[] = []

      hookBus.on('test:event', () => { executionOrder.push(20) }, 20)
      hookBus.on('test:event', () => { executionOrder.push(5) }, 5)
      hookBus.on('test:event', () => { executionOrder.push(10) }, 10)

      hookBus.action('test:event')

      expect(executionOrder).toEqual([5, 10, 20])
    })

    it('should use default priority 10 when not specified', () => {
      const executionOrder: number[] = []

      hookBus.on('test:event', () => { executionOrder.push(1) })
      hookBus.on('test:event', () => { executionOrder.push(2) }, 5)

      hookBus.action('test:event')

      // default 10 runs after priority 5
      expect(executionOrder).toEqual([2, 1])
    })

    it('should not throw when event has no subscribers', () => {
      expect(() => hookBus.action('nonexistent:event')).not.toThrow()
    })
  })

  describe('filter pipeline', () => {
    it('should return payload unchanged when no filters registered', () => {
      const payload = { items: [1, 2, 3] }
      const result = hookBus.applyFilter('test:filter', payload)
      expect(result).toEqual({ items: [1, 2, 3] })
    })

    it('should chain filter callbacks passing output as input', () => {
      hookBus.filter('test:filter', (payload: { items: number[] }) => {
        payload.items.push(3)
        return payload
      }, 10)

      hookBus.filter('test:filter', (payload: { items: number[] }) => {
        payload.items.push(4)
        return payload
      }, 20)

      const result = hookBus.applyFilter('test:filter', { items: [1, 2] })
      expect(result.items).toEqual([1, 2, 3, 4])
    })

    it('should respect priority order in filter pipeline', () => {
      const tags: string[] = []

      hookBus.filter('test:filter', (payload: { value: number }) => {
        tags.push('first')
        payload.value += 1
        return payload
      }, 5)

      hookBus.filter('test:filter', (payload: { value: number }) => {
        tags.push('second')
        payload.value *= 2
        return payload
      }, 20)

      const result = hookBus.applyFilter('test:filter', { value: 5 })
      expect(result.value).toBe(12) // (5 + 1) * 2 = 12
      expect(tags).toEqual(['first', 'second'])
    })
  })

  describe('unsubscription', () => {
    it('should remove an action subscriber via off()', () => {
      let callCount = 0
      const fn = () => { callCount++ }

      hookBus.on('test:event', fn)
      hookBus.off('test:event', fn)
      hookBus.action('test:event')

      expect(callCount).toBe(0)
    })

    it('should remove a filter subscriber via off()', () => {
      const fn = (payload: { value: string }) => {
        payload.value += ' mutated'
        return payload
      }

      hookBus.filter('test:filter', fn)
      hookBus.off('test:filter', fn)

      const result = hookBus.applyFilter('test:filter', { value: 'original' })
      expect(result.value).toBe('original')
    })
  })

  describe('data passing', () => {
    it('should pass data to action subscribers', () => {
      let received: unknown = null
      hookBus.on('test:event', (data) => { received = data }, 10)
      hookBus.action('test:event', { saleId: 42 })
      expect(received).toEqual({ saleId: 42 })
    })
  })
})
