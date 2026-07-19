import type { Product } from '@shared/types'

interface ProductCardProps {
  product: Product
  onSelect: (product: Product) => void
}

export default function ProductCard({ product, onSelect }: ProductCardProps): JSX.Element {
  const totalTaxRate = (product.taxes ?? []).reduce((sum, pt) => sum + (pt.tax?.rate ?? 0), 0)

  return (
    <button
      onClick={() => onSelect(product)}
      className="flex flex-col items-center gap-1 rounded-lg border border-hairline bg-surface-card p-3
        transition-all hover:border-primary hover:shadow-sm active:scale-[0.97]"
    >
      {product.image ? (
        <div className="h-12 w-12 overflow-hidden rounded-md border border-hairline bg-surface-soft">
          <img src={product.image} alt="" className="h-full w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        </div>
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-body-sm font-bold text-primary">
          {product.name.charAt(0).toUpperCase()}
        </div>
      )}
      <p className="text-center text-caption font-medium text-ink leading-tight line-clamp-2">{product.name}</p>
      <p className="text-body-sm font-semibold text-primary">${product.priceUsd.toFixed(2)}</p>
      {totalTaxRate > 0 && (
        <span className="text-caption text-muted-soft">IVA {totalTaxRate}%</span>
      )}
    </button>
  )
}
