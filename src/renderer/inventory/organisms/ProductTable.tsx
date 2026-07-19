import { useState, useEffect, useCallback } from 'react'
import type { Product } from '@shared/types'
import SearchInput from '../atoms/SearchInput'
import ProductRow from '../molecules/ProductRow'

interface ProductTableProps {
  onEdit: (product: Product) => void
}

export default function ProductTable({ onEdit }: ProductTableProps): JSX.Element {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.electronAPI.listProducts(true)
      if (res.success && res.data) {
        setProducts(res.data)
      } else {
        setError(res.error ?? 'Error al cargar productos')
      }
    } catch {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const handleDelete = async (product: Product): Promise<void> => {
    if (!window.confirm(`¿Eliminar "${product.name}"?`)) return
    const res = await window.electronAPI.deleteProduct(product.id)
    if (res.success) {
      await loadProducts()
    } else {
      setError(res.error ?? 'Error al eliminar producto')
    }
  }

  // Filter by search
  const filtered = search.trim()
    ? products.filter((p) =>
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : products

  return (
    <div className="flex flex-col gap-4">
      {/* Search + reload */}
      <div className="flex items-center gap-3">
        <div className="max-w-xs flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por código o nombre..."
          />
        </div>
        <button onClick={loadProducts}
          className="rounded-md border border-hairline px-3 py-2 text-body-sm text-muted transition-colors hover:text-ink">
          Actualizar
        </button>
        <p className="text-body-sm text-muted">
          {filtered.length} de {products.length} productos
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
          {error}
          <button onClick={loadProducts} className="ml-2 underline">Reintentar</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-body-sm text-muted-soft">Cargando productos...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-body-sm text-muted-soft">
            {search ? 'No se encontraron productos' : 'No hay productos registrados'}
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-hairline">
          <table className="w-full text-left text-body-sm">
            <thead>
              <tr className="border-b border-hairline bg-surface-soft">
                <th className="px-4 py-3 font-medium text-muted">Código</th>
                <th className="px-4 py-3 font-medium text-muted">Producto</th>
                <th className="px-4 py-3 font-medium text-muted">Stock</th>
                <th className="px-4 py-3 font-medium text-muted">Categoría / Imp.</th>
                <th className="px-4 py-3 text-right font-medium text-muted">Precio</th>
                <th className="px-4 py-3 text-right font-medium text-muted">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
