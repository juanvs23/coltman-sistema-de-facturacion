import type { Product } from '@shared/types'
import ProductBadge from '../atoms/ProductBadge'

interface ProductRowProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export default function ProductRow({ product, onEdit, onDelete }: ProductRowProps): JSX.Element {
  const taxNames = (product.taxes ?? [])
    .map(pt => pt.tax?.name ?? '')
    .filter(Boolean)
    .join(', ')

  return (
    <tr className="border-b border-hairline last:border-0">
      <td className="px-4 py-3 font-mono text-caption text-muted">{product.code}</td>
      <td className="px-4 py-3 text-ink">
        <div className="flex items-center gap-2">
          {product.image && (
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded border border-hairline bg-surface-soft">
              <img src={product.image} alt="" className="h-full w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
          )}
          <div>
            <p className="text-body-sm font-medium">{product.name}</p>
            {product.description && (
              <p className="text-caption text-muted-soft">{product.description}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <ProductBadge stock={product.stock} type={product.type} />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          {product.category && (
            <span className="inline-block rounded-full bg-surface-soft px-2 py-0.5 text-caption text-muted"
              style={product.category.color ? { backgroundColor: `${product.category.color}15`, color: product.category.color } : undefined}>
              {product.category.name}
            </span>
          )}
          {taxNames && (
            <span className="text-caption text-muted-soft">{taxNames}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <p className="text-body-sm text-ink font-medium">${product.priceUsd.toFixed(2)}</p>
        <p className="text-caption text-muted-soft">Bs. {product.price.toFixed(2)}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <button onClick={() => onEdit(product)}
            className="rounded px-2 py-1 text-caption text-muted transition-colors hover:bg-surface-soft hover:text-ink">
            Editar
          </button>
          <button onClick={() => onDelete(product)}
            className="rounded px-2 py-1 text-caption text-error transition-colors hover:bg-error/10">
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  )
}
