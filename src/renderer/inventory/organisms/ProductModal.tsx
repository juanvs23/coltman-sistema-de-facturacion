import type { Product, Category, Tax } from '@shared/types'
import ProductForm from '../molecules/ProductForm'
import type { ProductFormData } from '../molecules/ProductForm'

interface ProductModalProps {
  product: Product | null
  categories: Category[]
  taxes: Tax[]
  onSave: (data: ProductFormData) => Promise<void>
  onClose: () => void
}

export default function ProductModal({ product, categories, taxes, onSave, onClose }: ProductModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-surface-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-title-sm text-ink mb-4">
          {product ? 'Editar producto' : 'Nuevo producto'}
        </h3>
        <ProductForm
          product={product}
          categories={categories}
          taxes={taxes}
          onSave={onSave}
          onCancel={onClose}
        />
      </div>
    </div>
  )
}
