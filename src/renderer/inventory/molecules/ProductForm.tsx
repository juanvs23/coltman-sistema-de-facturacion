import { useState, useEffect } from 'react'
import type { Product, Category, Tax } from '@shared/types'

export interface ProductFormData {
  code: string
  name: string
  description: string
  type: 'PRODUCT' | 'SERVICE' | 'COMBO'
  priceUsd: number
  cost: number | null
  stock: number
  image: string
  categoryId: string | null
  taxIds: string[]
}

interface ProductFormProps {
  product: Product | null
  categories: Category[]
  taxes: Tax[]
  onSave: (data: ProductFormData) => Promise<void>
  onCancel: () => void
}

const PRODUCT_TYPES: { value: Product['type']; label: string }[] = [
  { value: 'PRODUCT', label: 'Producto' },
  { value: 'SERVICE', label: 'Servicio' },
  { value: 'COMBO', label: 'Combo' }
]

export default function ProductForm({ product, categories, taxes, onSave, onCancel }: ProductFormProps): JSX.Element {
  const isEditing = product !== null
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<Product['type']>('PRODUCT')
  const [priceUsd, setPriceUsd] = useState('')
  const [cost, setCost] = useState('')
  const [stock, setStock] = useState('0')
  const [image, setImage] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedTaxIds, setSelectedTaxIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (product) {
      setCode(product.code)
      setName(product.name)
      setDescription(product.description ?? '')
      setType(product.type)
      setPriceUsd(product.priceUsd.toString())
      setCost(product.cost?.toString() ?? '')
      setStock(product.stock.toString())
      setImage(product.image ?? '')
      setCategoryId(product.categoryId ?? '')
      setSelectedTaxIds(new Set((product.taxes ?? []).map(pt => pt.taxId)))
    }
  }, [product])

  const toggleTax = (taxId: string): void => {
    const next = new Set(selectedTaxIds)
    if (next.has(taxId)) next.delete(taxId)
    else next.add(taxId)
    setSelectedTaxIds(next)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')

    if (!code.trim()) { setError('El código es obligatorio'); return }
    if (!name.trim()) { setError('El nombre es obligatorio'); return }
    const usdNum = parseFloat(priceUsd)
    if (isNaN(usdNum) || usdNum <= 0) { setError('El precio en USD debe ser un número positivo'); return }
    if (type === 'PRODUCT') {
      const stockNum = parseInt(stock, 10)
      if (isNaN(stockNum) || stockNum < 0) { setError('El stock debe ser un número válido'); return }
    }

    setSaving(true)
    try {
      await onSave({
        code: code.trim(),
        name: name.trim(),
        description: description.trim(),
        type,
        priceUsd: usdNum,
        cost: cost ? parseFloat(cost) : null,
        stock: type === 'PRODUCT' ? parseInt(stock, 10) : 0,
        image: image.trim(),
        categoryId: categoryId || null,
        taxIds: Array.from(selectedTaxIds)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Code / SKU */}
        <div className="flex flex-col gap-1">
          <label className="text-caption text-muted" htmlFor="prod-code">Código / SKU</label>
          <input id="prod-code" type="text" value={code} onChange={(e) => setCode(e.target.value)}
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none"
            placeholder="Ej: P001 o código de barras" disabled={isEditing} />
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1">
          <label className="text-caption text-muted" htmlFor="prod-type">Tipo</label>
          <select id="prod-type" value={type} onChange={(e) => setType(e.target.value as Product['type'])}
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none">
            {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Name */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-caption text-muted" htmlFor="prod-name">Nombre</label>
          <input id="prod-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none"
            placeholder="Nombre del producto" />
        </div>

        {/* Description */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-caption text-muted" htmlFor="prod-desc">Descripción</label>
          <textarea id="prod-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none resize-none"
            placeholder="Descripción opcional" />
        </div>

        {/* Price USD (primary) */}
        <div className="flex flex-col gap-1">
          <label className="text-caption text-muted" htmlFor="prod-priceusd">
            Precio USD <span className="text-error">*</span>
          </label>
          <input id="prod-priceusd" type="number" step="0.01" min="0" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)}
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" placeholder="0.00" />
        </div>

        {/* Cost */}
        <div className="flex flex-col gap-1">
          <label className="text-caption text-muted" htmlFor="prod-cost">Costo (USD)</label>
          <input id="prod-cost" type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)}
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" placeholder="Opcional" />
        </div>

        {/* Stock */}
        <div className="flex flex-col gap-1">
          <label className="text-caption text-muted" htmlFor="prod-stock">Stock</label>
          <input id="prod-stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)}
            disabled={type !== 'PRODUCT'}
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none disabled:opacity-50" />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-caption text-muted" htmlFor="prod-cat">Categoría</label>
          <select id="prod-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none">
            <option value="">Sin categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Image */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-caption text-muted" htmlFor="prod-image">Imagen (ruta o URL)</label>
          <input id="prod-image" type="text" value={image} onChange={(e) => setImage(e.target.value)}
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none"
            placeholder="Opcional — ruta local o URL de la imagen" />
        </div>
      </div>

      {/* Taxes */}
      {taxes.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-caption text-muted">Impuestos aplicables</p>
          <div className="flex flex-wrap gap-2">
            {taxes.map((tax) => {
              const active = selectedTaxIds.has(tax.id)
              return (
                <button
                  key={tax.id}
                  type="button"
                  onClick={() => toggleTax(tax.id)}
                  disabled={!tax.active}
                  className={`rounded-full px-3 py-1.5 text-caption transition-colors
                    ${active
                      ? 'bg-primary text-on-primary'
                      : tax.active
                        ? 'border border-hairline text-muted hover:border-primary hover:text-primary'
                        : 'border border-hairline text-muted-soft line-through opacity-50'
                    }`}
                >
                  {tax.name} ({tax.rate}%)
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="rounded-md border border-hairline px-4 py-2 text-body-sm text-muted transition-colors hover:text-ink">
          Cancelar
        </button>
        <button type="submit" disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50">
          {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}
