import { useState, useEffect, useCallback } from 'react'
import type { Product, Category, Tax } from '@shared/types'
import ProductTable from '../organisms/ProductTable'
import ProductModal from '../organisms/ProductModal'
import CategoriesTab from '../organisms/CategoriesTab'
import type { ProductFormData } from '../molecules/ProductForm'

type InventorySubTab = 'products' | 'categories'

export default function InventoryPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<InventorySubTab>('products')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [taxes, setTaxes] = useState<Tax[]>([])

  const loadCategories = useCallback(async () => {
    const res = await window.electronAPI.listCategories()
    if (res.success && res.data) setCategories(res.data)
  }, [])

  const loadTaxes = useCallback(async () => {
    const res = await window.electronAPI.listTaxes()
    if (res.success && res.data) setTaxes(res.data)
  }, [])

  useEffect(() => {
    loadCategories()
    loadTaxes()
  }, [loadCategories, loadTaxes])

  const handleSave = async (data: ProductFormData): Promise<void> => {
    if (editingProduct) {
      const res = await window.electronAPI.updateProduct(editingProduct.id, data)
      if (res.success) {
        setEditingProduct(null)
        await loadTaxes() // refresh tax relations
      } else {
        throw new Error(res.error)
      }
    } else {
      const res = await window.electronAPI.createProduct(data)
      if (res.success) {
        setShowCreate(false)
        await loadTaxes()
      } else {
        throw new Error(res.error)
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-surface-soft/50">
      {/* Header */}
      <div className="border-b border-hairline bg-canvas">
        <div className="flex items-center justify-between px-6 pt-4 pb-0">
          <h2 className="text-title-md text-ink">Inventario</h2>
          {activeTab === 'products' && (
            <button onClick={() => setShowCreate(true)}
              className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary transition-opacity hover:opacity-90">
              + Nuevo producto
            </button>
          )}
        </div>
        <nav className="flex gap-1 px-6 pb-3">
          <button
            onClick={() => setActiveTab('products')}
            className={`rounded-md px-4 py-2 text-body-sm font-medium transition-colors
              ${activeTab === 'products' ? 'bg-surface-card text-ink shadow-sm' : 'text-muted hover:bg-surface-soft hover:text-ink'}`}
          >
            Productos
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`rounded-md px-4 py-2 text-body-sm font-medium transition-colors
              ${activeTab === 'categories' ? 'bg-surface-card text-ink shadow-sm' : 'text-muted hover:bg-surface-soft hover:text-ink'}`}
          >
            Categorías
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'products' && (
          <ProductTable onEdit={setEditingProduct} />
        )}
        {activeTab === 'categories' && <CategoriesTab />}
      </div>

      {/* Modals */}
      {showCreate && (
        <ProductModal
          product={null}
          categories={categories}
          taxes={taxes}
          onSave={handleSave}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editingProduct && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          taxes={taxes}
          onSave={handleSave}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  )
}
