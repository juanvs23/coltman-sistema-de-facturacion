export function formatCurrency(amount: number, symbol = '$'): string {
  return `${symbol} ${amount.toFixed(2)}`
}
