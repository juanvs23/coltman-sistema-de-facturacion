import type { CartEntry } from '../organisms/ShoppingCart'
import QuantityInput from '../atoms/QuantityInput'
import { useCountry } from '../../shared/hooks/useCountry'

interface CartItemProps {
  entry: CartEntry
  usdRate: number
  onUpdateQuantity: (productId: string, quantity: number) => void
  onUpdateDiscount: (productId: string, discount: number) => void
  onRemove: (productId: string) => void
}

export default function CartItem({ entry, usdRate, onUpdateQuantity, onUpdateDiscount, onRemove }: CartItemProps): JSX.Element {
  const lineSubtotalUsd = entry.product.priceUsd * entry.quantity
  const lineDiscount = entry.discount ?? 0
  const discountedUsd = lineSubtotalUsd - lineDiscount
  const { currencySymbol } = useCountry()

  const discountPct = lineSubtotalUsd > 0 ? Math.round((lineDiscount / lineSubtotalUsd) * 100) : 0

  const handleDiscountPercent = (pctStr: string): void => {
    const pct = parseFloat(pctStr)
    if (isNaN(pct) || pct < 0 || pct > 100) return
    const amount = Math.round(lineSubtotalUsd * (pct / 100) * 100) / 100
    onUpdateDiscount(entry.product.id, amount)
  }

  return (
    <div className="flex flex-col border-b border-hairline px-4 py-2 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-medium text-ink truncate">{entry.product.name}</p>
          <p className="text-caption text-muted-soft">${entry.product.priceUsd.toFixed(2)} c/u</p>
        </div>
        <QuantityInput
          value={entry.quantity}
          onChange={(q) => onUpdateQuantity(entry.product.id, q)}
          min={1}
          max={entry.product.type === 'PRODUCT' ? entry.product.stock : 999}
        />
        <div className="text-right w-24">
          <p className="text-body-sm font-medium text-ink">${discountedUsd.toFixed(2)}</p>
          <p className="text-caption text-muted-soft">{currencySymbol} {(discountedUsd * usdRate).toFixed(2)}</p>
        </div>
        <button
          onClick={() => onRemove(entry.product.id)}
          className="flex h-7 w-7 items-center justify-center rounded text-caption text-muted-soft
            transition-colors hover:bg-error/10 hover:text-error"
        >
          ✕
        </button>
      </div>

      {/* Discount row */}
      {lineDiscount > 0 && (
        <div className="flex items-center gap-2 mt-1 ml-0 pl-0">
          <span className="text-caption text-muted-soft">Desc.</span>
          <input
            type="number"
            min="0"
            max="100"
            value={discountPct}
            onChange={e => handleDiscountPercent(e.target.value)}
            className="w-14 rounded border border-hairline bg-canvas px-1 py-0.5 text-caption text-ink text-center focus:border-primary focus:outline-none"
          />
          <span className="text-caption text-muted-soft">% (−${lineDiscount.toFixed(2)})</span>
          <button
            onClick={() => onUpdateDiscount(entry.product.id, 0)}
            className="text-caption text-muted-soft hover:text-error ml-auto"
          >
            Quitar
          </button>
        </div>
      )}

      {/* Add discount button */}
      {lineDiscount === 0 && (
        <button
          onClick={() => onUpdateDiscount(entry.product.id, 0.01)}
          className="text-caption text-primary/60 hover:text-primary transition-colors mt-1 self-start ml-0"
        >
          + Añadir descuento
        </button>
      )}
    </div>
  )
}
