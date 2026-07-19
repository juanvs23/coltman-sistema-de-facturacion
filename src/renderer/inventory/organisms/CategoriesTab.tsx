import { useState, useEffect, useCallback } from 'react'
import type { Category } from '@shared/types'

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function CategoriesTab(): JSX.Element {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Category | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.electronAPI.listCategories()
      if (res.success && res.data) setCategories(res.data)
      else setError(res.error ?? 'Error al cargar')
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = fd.get('name') as string
    const color = fd.get('color') as string
    if (!name.trim()) return
    const res = await window.electronAPI.createCategory(name.trim(), color || undefined)
    if (res.success) { setShowCreate(false); await load() }
    else setError(res.error ?? 'Error al crear')
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    if (!editing) return
    const fd = new FormData(e.currentTarget)
    const name = fd.get('name') as string
    const color = fd.get('color') as string
    if (!name.trim()) return
    const res = await window.electronAPI.updateCategory(editing.id, name.trim(), color || undefined)
    if (res.success) { setEditing(null); await load() }
    else setError(res.error ?? 'Error al actualizar')
  }

  const handleDelete = async (cat: Category): Promise<void> => {
    if (!window.confirm(`¿Eliminar categoría "${cat.name}"? Los productos quedarán sin categoría.`)) return
    const res = await window.electronAPI.deleteCategory(cat.id)
    if (res.success) await load()
    else setError(res.error ?? 'Error al eliminar')
  }

  const ColorPicker = ({ name, defaultValue = '#3b82f6' }: { name: string; defaultValue?: string }) => (
    <div className="flex gap-1">
      {PRESET_COLORS.map(c => (
        <label key={c} className="flex cursor-pointer items-center gap-1">
          <input type="radio" name={name} value={c} defaultChecked={c === defaultValue}
            className="sr-only peer" />
          <div className="h-6 w-6 rounded-full border-2 border-transparent peer-checked:border-ink transition-colors"
            style={{ backgroundColor: c }} />
        </label>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-muted">{categories.length} categorías</p>
        <button onClick={() => setShowCreate(true)}
          className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary transition-opacity hover:opacity-90">
          + Nueva categoría
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
          {error} <button onClick={load} className="ml-2 underline">Reintentar</button>
        </div>
      )}

      {loading && <p className="text-body-sm text-muted-soft py-8 text-center">Cargando...</p>}

      {!loading && categories.length === 0 && (
        <p className="text-body-sm text-muted-soft py-8 text-center">No hay categorías</p>
      )}

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-body-sm font-medium text-ink mb-3">Nueva categoría</p>
          <div className="flex flex-col gap-3">
            <input name="name" placeholder="Nombre de la categoría" autoFocus required
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            <ColorPicker name="color-create" />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowCreate(false)}
                className="rounded-md border border-hairline px-3 py-1.5 text-caption text-muted hover:text-ink">Cancelar</button>
              <button type="submit"
                className="rounded-md bg-primary px-3 py-1.5 text-caption text-on-primary hover:opacity-90">Crear</button>
            </div>
          </div>
        </form>
      )}

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleUpdate} className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-body-sm font-medium text-ink mb-3">Editar categoría</p>
          <div className="flex flex-col gap-3">
            <input name="name" defaultValue={editing.name} placeholder="Nombre" autoFocus required
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            <ColorPicker name="color-edit" defaultValue={editing.color ?? '#3b82f6'} />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditing(null)}
                className="rounded-md border border-hairline px-3 py-1.5 text-caption text-muted hover:text-ink">Cancelar</button>
              <button type="submit"
                className="rounded-md bg-primary px-3 py-1.5 text-caption text-on-primary hover:opacity-90">Guardar</button>
            </div>
          </div>
        </form>
      )}

      {/* List */}
      {!loading && categories.length > 0 && (
        <div className="flex flex-col gap-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between rounded-lg border border-hairline bg-surface-card px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color ?? '#ccc' }} />
                <span className="text-body-sm text-ink">{cat.name}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(cat)}
                  className="rounded px-2 py-1 text-caption text-muted hover:bg-surface-soft hover:text-ink">Editar</button>
                <button onClick={() => handleDelete(cat)}
                  className="rounded px-2 py-1 text-caption text-error hover:bg-error/10">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
