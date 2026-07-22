import { useState, useEffect, useCallback, useRef } from 'react'
import type { Product } from '@shared/types'
import { ImSearch } from 'react-icons/im'
import ProductGrid from '../molecules/ProductGrid'
import { useCountry } from '../../shared/hooks/useCountry'

interface ProductSearchProps {
  onSelectProduct: (product: Product) => void
  focusKey?: number // increment to focus search
}

export default function ProductSearch({ onSelectProduct, focusKey = 0 }: ProductSearchProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usdRate, setUsdRate] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { currencySymbol } = useCountry()

  // Focus search input when focusKey changes (e.g. F2 pressed)
  useEffect(() => {
    inputRef.current?.focus()
  }, [focusKey])

  // Load products and rate on mount
  useEffect(() => {
    loadProducts()
    loadRate()
  }, [])

  const loadRate = useCallback(async () => {
    const res = await window.electronAPI.getUsdRate()
    if (res.success && res.data) setUsdRate(res.data.rate)
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.electronAPI.listProducts(true)
      if (res.success && res.data) setProducts(res.data)
      else setError(res.error ?? 'Error al cargar')
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }, [])

  // Filter products by search query and category
  const filtered = query.trim()
    ? products.filter(p =>
        p.code.toLowerCase().includes(query.toLowerCase()) ||
        p.name.toLowerCase().includes(query.toLowerCase())
      )
    : products

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="relative">
        <ImSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por código o nombre... (F2)"
          className="w-full rounded-lg border border-hairline bg-canvas py-3 pl-10 pr-4 text-body-sm text-ink
            placeholder:text-muted-soft focus:border-primary focus:outline-none"
        />
      </div>

      {error && (
        <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
          {error} <button onClick={loadProducts} className="ml-2 underline">Reintentar</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-body-sm text-muted-soft">Cargando productos...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-body-sm text-muted-soft">
            {query ? 'No se encontraron productos' : 'No hay productos disponibles'}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          {usdRate > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-caption text-muted-soft">{filtered.length} productos</p>
              <p className="text-caption text-muted-soft">Tasa: {currencySymbol} {usdRate.toFixed(2)}</p>
            </div>
          )}
          <ProductGrid products={filtered} onSelect={onSelectProduct} />
        </>
      )}
    </div>
  )
}
