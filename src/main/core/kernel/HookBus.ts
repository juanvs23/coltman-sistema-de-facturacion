/**
 * Hook Bus — event system for core-plugin and inter-plugin communication.
 *
 * Supports two types of hooks:
 * - **Actions**: fire-and-forget. All subscribers receive the same data.
 * - **Filters**: pipeline. Each subscriber receives the output of the
 *   previous one and MUST return the (possibly modified) payload.
 *
 * Both types support numeric priority (lower = executes first, default 10).
 *
 * @packageDocumentation
 */

import type { IHookSubscriber, HookCallback } from '@plugin-api/contracts/IHookSubscriber'

/** Internal entry stored for each subscriber */
interface SubscriberEntry {
  callback: HookCallback
  priority: number
}

/**
 * HookBus — manages action and filter hook subscribers with priority ordering.
 *
 * @example
 * ```ts
 * const bus = new HookBus()
 *
 * // Action subscriber (fire-and-forget)
 * bus.on('sale:completed', (data) => logSale(data), 10)
 * bus.action('sale:completed', { saleId: 1 })
 *
 * // Filter subscriber (pipeline)
 * bus.filter('printer:receipt-data', (payload) => {
 *   payload.footer.push('Thanks!')
 *   return payload
 * }, 5)
 * const result = bus.applyFilter('printer:receipt-data', { footer: [] })
 * ```
 */
export class HookBus implements IHookSubscriber {
  /** Action subscribers: event name → sorted entries */
  private actions: Map<string, SubscriberEntry[]> = new Map()

  /** Filter subscribers: event name → sorted entries */
  private filters: Map<string, SubscriberEntry[]> = new Map()

  // ─── Registration ──────────────────────────────────────────

  /**
   * Register an action subscriber.
   * Priority defaults to 10. Lower values execute first.
   */
  on(event: string, callback: HookCallback, priority: number = 10): void {
    this.addSubscriber(this.actions, event, callback, priority)
  }

  /**
   * Register a filter subscriber.
   * Priority defaults to 10. Lower values execute first.
   */
  filter(event: string, callback: HookCallback, priority: number = 10): void {
    this.addSubscriber(this.filters, event, callback, priority)
  }

  /**
   * Remove a subscriber from both action and filter maps.
   * Safe to call even if the callback was never registered.
   */
  off(event: string, callback: HookCallback): void {
    this.removeSubscriber(this.actions, event, callback)
    this.removeSubscriber(this.filters, event, callback)
  }

  // ─── Dispatch ──────────────────────────────────────────────

  /**
   * Dispatch an action event.
   * All registered action subscribers are called with the provided data
   * in priority order (ascending).
   */
  action(event: string, data?: unknown): void {
    const entries = this.actions.get(event)
    if (!entries) return
    for (const entry of entries) {
      entry.callback(data)
    }
  }

  /**
   * Dispatch a filter pipeline.
   * Each filter subscriber receives the payload, transforms it,
   * and passes the result to the next subscriber.
   * Returns the final transformed payload.
   */
  applyFilter<T>(event: string, payload: T): T {
    const entries = this.filters.get(event)
    if (!entries) return payload

    return entries.reduce((current, entry) => {
      const result = entry.callback(current)
      // If the callback returns undefined (void), keep the current payload
      return result !== undefined ? result : current
    }, payload) as T
  }

  // ─── Private helpers ───────────────────────────────────────

  /**
   * Add a subscriber to the given map, maintaining ascending priority order.
   */
  private addSubscriber(
    map: Map<string, SubscriberEntry[]>,
    event: string,
    callback: HookCallback,
    priority: number
  ): void {
    if (!map.has(event)) {
      map.set(event, [])
    }
    const entries = map.get(event)!

    // Find insertion index: first entry with priority > given priority
    const insertAt = entries.findIndex((e) => e.priority > priority)
    if (insertAt === -1) {
      entries.push({ callback, priority })
    } else {
      entries.splice(insertAt, 0, { callback, priority })
    }
  }

  /**
   * Remove a subscriber from a specific event map by callback reference.
   */
  private removeSubscriber(
    map: Map<string, SubscriberEntry[]>,
    event: string,
    callback: HookCallback
  ): void {
    const entries = map.get(event)
    if (!entries) return

    const idx = entries.findIndex((e) => e.callback === callback)
    if (idx !== -1) {
      entries.splice(idx, 1)
      if (entries.length === 0) {
        map.delete(event)
      }
    }
  }
}
