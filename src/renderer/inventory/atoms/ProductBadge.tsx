interface ProductBadgeProps {
  stock: number
  type: 'PRODUCT' | 'SERVICE' | 'COMBO'
  lowStockThreshold?: number
}

export default function ProductBadge({ stock, type, lowStockThreshold = 10 }: ProductBadgeProps): JSX.Element {
  if (type !== 'PRODUCT') {
    return (
      <span className="inline-block rounded-full bg-surface-soft px-2 py-0.5 text-caption text-muted">
        {type === 'SERVICE' ? 'Servicio' : 'Combo'}
      </span>
    )
  }

  if (stock === 0) {
    return (
      <span className="inline-block rounded-full bg-error/10 px-2 py-0.5 text-caption text-error">
        Sin stock
      </span>
    )
  }

  if (stock <= lowStockThreshold) {
    return (
      <span className="inline-block rounded-full bg-warning/10 px-2 py-0.5 text-caption text-warning">
        {stock} uds.
      </span>
    )
  }

  return (
    <span className="inline-block rounded-full bg-success/10 px-2 py-0.5 text-caption text-success">
      {stock} uds.
    </span>
  )
}
