/**
 * Hook Subscriber — contract for subscribing to and dispatching
 * hook events (actions) and filter pipelines.
 *
 * Actions are fire-and-forget: all registered callbacks receive the
 * same data payload. Filters form a pipeline: each callback receives
 * the output of the previous one and MUST return the (possibly modified)
 * payload.
 *
 * @example
 * ```ts
 * // Subscribe to an action
 * hookBus.on('sale:completed', (data) => {
 *   console.log('Sale completed:', data)
 * }, 10)
 *
 * // Subscribe to a filter
 * hookBus.filter('printer:receipt-data', (payload) => {
 *   payload.lines.push({ type: 'text', text: '-- footer --' })
 *   return payload
 * }, 5)
 * ```
 */

import type { PluginResult } from '../types'

/** Generic callback for hook subscribers */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HookCallback<T = any> = (data: T) => T | void

/**
 * Contract for subscribing to and dispatching hooks.
 * Plugins receive this interface via the kernel to interact with
 * the hook system.
 */
export interface IHookSubscriber {
  /**
   * Register an action subscriber.
   * Lower priority values execute first (default: 10).
   */
  on(event: string, callback: HookCallback, priority?: number): void

  /**
   * Register a filter subscriber.
   * Filter callbacks receive the payload and MUST return it
   * (possibly modified). Lower priority values execute first.
   */
  filter(event: string, callback: HookCallback, priority?: number): void

  /**
   * Remove a previously registered subscriber (action or filter).
   */
  off(event: string, callback: HookCallback): void

  /**
   * Dispatch an action event.
   * All registered action subscribers for this event are called
   * with the provided data, in priority order.
   */
  action(event: string, data?: unknown): void

  /**
   * Dispatch a filter pipeline.
   * Each registered filter subscriber receives the payload,
   * transforms it, and passes it to the next subscriber.
   * Returns the final transformed payload.
   */
  applyFilter<T>(event: string, payload: T): T

  /**
   * Clean up all subscribers for a given event (optional).
   */
  clear?(event: string): void
}
