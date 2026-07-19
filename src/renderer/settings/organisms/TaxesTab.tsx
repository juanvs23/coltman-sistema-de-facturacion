import { useState, useEffect, useCallback } from 'react'
import type { Tax } from '@shared/types'

interface TaxFormData {
  name: string
  rate: string
  description: string
}

const emptyForm: TaxFormData = { name: '', rate: '', description: '' }

export default function TaxesTab(): JSX.Element {
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Tax | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<TaxFormData>(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.electronAPI.listTaxes()
      if (res.success && res.data) setTaxes(res.data)
      else setError(res.error ?? 'Error al cargar')
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const resetForm = () => setForm(emptyForm)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const rate = parseFloat(form.rate)
    if (!form.name.trim() || isNaN(rate) || rate < 0) return

    if (editing) {
      const res = await window.electronAPI.updateTax(editing.id, {
        name: form.name.trim(),
        rate,
        description: form.description.trim() || undefined
      })
      if (res.success) { setEditing(null); resetForm(); await load() }
      else setError(res.error ?? 'Error al actualizar')
    } else {
      const res = await window.electronAPI.createTax({
        name: form.name.trim(),
        rate,
        description: form.description.trim() || undefined
      })
      if (res.success) { setShowCreate(false); resetForm(); await load() }
      else setError(res.error ?? 'Error al crear')
    }
  }

  const handleToggleActive = async (tax: Tax): Promise<void> => {
    const res = await window.electronAPI.updateTax(tax.id, { active: !tax.active })
    if (res.success) await load()
    else setError(res.error ?? 'Error al cambiar estado')
  }

  const openEdit = (tax: Tax): void => {
    setEditing(tax)
    setForm({ name: tax.name, rate: tax.rate.toString(), description: tax.description ?? '' })
    setShowCreate(false)
  }

  const openCreate = (): void => {
    setShowCreate(true)
    setEditing(null)
    resetForm()
  }

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-muted">{taxes.length} impuestos configurados</p>
        {!showCreate && !editing && (
          <button onClick={openCreate}
            className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary transition-opacity hover:opacity-90">
            + Nuevo impuesto
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
          {error} <button onClick={load} className="ml-2 underline">Reintentar</button>
        </div>
      )}

      {loading && <p className="text-body-sm text-muted-soft py-8 text-center">Cargando...</p>}

      {/* Form (create / edit) */}
      {(showCreate || editing) && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-body-sm font-medium text-ink mb-3">
            {editing ? 'Editar impuesto' : 'Nuevo impuesto'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-caption text-muted">Nombre</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: IVA 16%" required autoFocus
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted">Tasa (%)</label>
              <input type="number" step="0.01" min="0" max="100" value={form.rate}
                onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} required
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted">Descripción</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Opcional"
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" onClick={() => { setShowCreate(false); setEditing(null); resetForm() }}
              className="rounded-md border border-hairline px-3 py-1.5 text-caption text-muted hover:text-ink">Cancelar</button>
            <button type="submit"
              className="rounded-md bg-primary px-3 py-1.5 text-caption text-on-primary hover:opacity-90">
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {!loading && taxes.length > 0 && (
        <div className="flex flex-col gap-2">
          {taxes.map(tax => (
            <div key={tax.id}
              className={`flex items-center justify-between rounded-lg border px-4 py-3
                ${tax.active ? 'border-hairline bg-surface-card' : 'border-hairline bg-surface-soft opacity-60'}`}>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-body-sm font-medium text-ink">{tax.name}</p>
                  <p className="text-caption text-muted-soft">{tax.rate}%{tax.description ? ` — ${tax.description}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(tax)}
                  className="rounded px-2 py-1 text-caption text-muted hover:bg-surface-soft hover:text-ink">Editar</button>
                <button onClick={() => handleToggleActive(tax)}
                  className={`rounded px-2 py-1 text-caption ${tax.active ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'}`}>
                  {tax.active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
