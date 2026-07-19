import type { Product } from '@shared/types'
import QuantityInput from '../atoms/QuantityInput'

interface CartEntry {
  product: Product
  quantity: number
}

interface CartItemProps {
  entry: CartEntry
  usdRate: number
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}

export default function CartItem({ entry, usdRate, onUpdateQuantity, onRemove }: CartItemProps): JSX.Element {
  const lineTotalUsd = entry.product.priceUsd * entry.quantity
  const lineTotalBs = lineTotalUsd * usdRate

  return (
    <div className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-0">
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
        <p className="text-body-sm font-medium text-ink">${lineTotalUsd.toFixed(2)}</p>
        <p className="text-caption text-muted-soft">Bs. {lineTotalBs.toFixed(2)}</p>
      </div>
      <button
        onClick={() => onRemove(entry.product.id)}
        className="flex h-7 w-7 items-center justify-center rounded text-caption text-muted-soft
          transition-colors hover:bg-error/10 hover:text-error"
      >
        ✕
      </button>
    </div>
  )
}
