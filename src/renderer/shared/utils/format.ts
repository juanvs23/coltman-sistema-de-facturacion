/**
 * Format a currency amount with the given symbol.
 * Defaults to 'Bs.' if no symbol provided (backwards-compatible).
 */
export function formatCurrency(amount: number, symbol = 'Bs.'): string {
  return `${symbol} ${amount.toFixed(2)}`
}
