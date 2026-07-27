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
  const { currencySymbol, defaultExchangeRate } = useCountry()
  const isDualCurrency = defaultExchangeRate !== null && defaultExchangeRate > 0

  const formatLocal = (usd: number): string => `${currencySymbol} ${(usd * usdRate).toFixed(2)}`
  const formatUsd = (usd: number): string => `$${usd.toFixed(2)}`

  return (
    <div className="border-t border-hairline px-4 py-3 space-y-1">
      <div className="flex justify-between text-body-sm">
        <span className="text-muted">Subtotal</span>
        <span className="text-ink">{isDualCurrency ? formatLocal(subtotalUsd) : formatUsd(subtotalUsd)}</span>
      </div>
      {hasDiscount && (
        <div className="flex justify-between text-body-sm">
          <span className="text-success">Descuento</span>
          <span className="text-success">−{isDualCurrency ? formatLocal(discountTotalUsd) : formatUsd(discountTotalUsd)}</span>
        </div>
      )}
      <div className="flex justify-between text-body-sm">
        <span className="text-muted">Impuestos</span>
        <span className="text-ink">{isDualCurrency ? formatLocal(taxTotalUsd) : formatUsd(taxTotalUsd)}</span>
      </div>
      <div className="flex justify-between text-body-sm font-bold border-t border-hairline pt-2">
        <span className="text-ink">Total</span>
        <div className="text-right">
          {isDualCurrency ? (
            <>
              <p className="text-ink">{formatLocal(totalUsd)}</p>
              <p className="text-caption text-muted-soft">{formatUsd(totalUsd)} USD</p>
            </>
          ) : (
            <p className="text-ink">{formatUsd(totalUsd)}</p>
          )}
        </div>
      </div>
    </div>
  )
}
