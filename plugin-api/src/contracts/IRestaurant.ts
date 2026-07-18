import type { PluginResult } from '../types'

/**
 * Table status in the restaurant module.
 */
export type TableStatus = 'free' | 'occupied' | 'reserved' | 'cleaning'

/**
 * A table in the restaurant layout.
 */
export interface TableInfo {
  id: string
  number: number
  capacity: number
  status: TableStatus
  /** Optional label (e.g., "Terraza", "VIP") */
  zone?: string
}

/**
 * A split or shared order.
 */
export interface OrderSplit {
  id: string
  tableId: string
  customerName?: string
  items: Array<{
    productId: string
    name: string
    quantity: number
    price: number
  }>
  total: number
}

/**
 * Contract for the restaurant module plugin.
 *
 * Adds table management, order splitting, and kitchen printing
 * to the base POS.
 */
export interface IRestaurant {
  /**
   * Get all tables with their current status.
   */
  getTables(): Promise<PluginResult<TableInfo[]>>

  /**
   * Assign a table to a customer.
   */
  assignTable(tableId: string, customerName?: string): Promise<PluginResult>

  /**
   * Release a table (after payment).
   */
  releaseTable(tableId: string): Promise<PluginResult>

  /**
   * Split an order across multiple customers or tables.
   */
  splitOrder(orderId: string, splits: OrderSplit[]): Promise<PluginResult>

  /**
   * Send an order to the kitchen printer.
   */
  sendToKitchen(orderId: string, items: Array<{
    name: string
    quantity: number
    notes?: string
  }>): Promise<PluginResult>

  /**
   * Get the current orders for a table.
   */
  getTableOrders(tableId: string): Promise<PluginResult<OrderSplit[]>>
}
