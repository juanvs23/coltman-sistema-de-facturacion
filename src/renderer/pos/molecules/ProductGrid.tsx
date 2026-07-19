import type { Product } from '@shared/types'
import ProductCard from '../atoms/ProductCard'

interface ProductGridProps {
  products: Product[]
  onSelect: (product: Product) => void
}

export default function ProductGrid({ products, onSelect }: ProductGridProps): JSX.Element {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onSelect={onSelect} />
      ))}
    </div>
  )
}
