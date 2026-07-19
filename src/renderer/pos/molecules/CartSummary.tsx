import type { Product } from '@shared/types'

interface CartEntry {
  product: Product
  quantity: number
}

interface CartSummaryProps {
  entries: CartEntry[]
  usdRate: number
}

export default function CartSummary({ entries, usdRate }: CartSummaryProps): JSX.Element {
  const subtotalUsd = entries.reduce((sum, e) => sum + e.product.priceUsd * e.quantity, 0)
  // Calculate total tax rate for each entry
  const taxTotalUsd = entries.reduce((sum, e) => {
    const totalRate = (e.product.taxes ?? []).reduce((s, pt) => s + (pt.tax?.rate ?? 0), 0)
    return sum + (e.product.priceUsd * e.quantity * totalRate) / 100
  }, 0)
  const totalUsd = subtotalUsd + taxTotalUsd

  return (
    <div className="border-t border-hairline px-4 py-3 space-y-1">
      <div className="flex justify-between text-body-sm">
        <span className="text-muted">Subtotal</span>
        <span className="text-ink">${subtotalUsd.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-body-sm">
        <span className="text-muted">Impuestos</span>
        <span className="text-ink">${taxTotalUsd.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-body-sm font-bold border-t border-hairline pt-2">
        <span className="text-ink">Total</span>
        <div className="text-right">
          <p className="text-ink">${totalUsd.toFixed(2)}</p>
          <p className="text-caption text-muted-soft">Bs. {(totalUsd * usdRate).toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
