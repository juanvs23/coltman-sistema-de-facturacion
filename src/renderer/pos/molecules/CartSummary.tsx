import type { CartEntry } from '../organisms/ShoppingCart'
import { calcCartTotals } from './calcCartTotals'
import { useCountry } from '../../shared/hooks/useCountry'

interface CartSummaryProps {
  entries: CartEntry[]
  usdRate: number
  globalDiscount?: number
}

export default function CartSummary({ entries, usdRate, globalDiscount = 0 }: CartSummaryProps): JSX.Element {
  const { subtotalUsd, taxTotalUsd, discountTotalUsd, totalUsd } = calcCartTotals(entries, globalDiscount)
  const hasDiscount = discountTotalUsd > 0 || globalDiscount > 0
  const { currencySymbol } = useCountry()

  return (
    <div className="border-t border-hairline px-4 py-3 space-y-1">
      <div className="flex justify-between text-body-sm">
        <span className="text-muted">Subtotal</span>
        <span className="text-ink">${subtotalUsd.toFixed(2)}</span>
      </div>
      {hasDiscount && (
        <div className="flex justify-between text-body-sm">
          <span className="text-success">Descuento</span>
          <span className="text-success">−${discountTotalUsd.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-body-sm">
        <span className="text-muted">Impuestos</span>
        <span className="text-ink">${taxTotalUsd.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-body-sm font-bold border-t border-hairline pt-2">
        <span className="text-ink">Total</span>
        <div className="text-right">
          <p className="text-ink">${totalUsd.toFixed(2)}</p>
          <p className="text-caption text-muted-soft">{currencySymbol} {(totalUsd * usdRate).toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
