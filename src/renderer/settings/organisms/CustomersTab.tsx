import { useState, useEffect, useCallback } from 'react'
import type { Customer } from '@shared/types'
import { useCountry } from '@renderer/shared/hooks/useCountry'

interface CustomerForm {
  taxId: string
  name: string
  address: string
  phone: string
  email: string
}

const emptyForm: CustomerForm = { taxId: '', name: '', address: '', phone: '', email: '' }

export default function CustomersTab(): JSX.Element {
  const country = useCountry()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Customer | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CustomerForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.electronAPI.listCustomers()
      if (res.success && res.data) setCustomers(res.data)
      else setError(res.error ?? 'Error al cargar')
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const resetForm = () => { setForm(emptyForm); setFormError('') }

  const openCreate = () => { setShowCreate(true); setEditing(null); resetForm() }
  const openEdit = (c: Customer) => {
    setEditing(c)
    setForm({ taxId: c.taxId, name: c.name, address: c.address ?? '', phone: c.phone ?? '', email: c.email ?? '' })
    setShowCreate(false)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setFormError('')

    if (!form.name.trim()) { setFormError('El nombre es obligatorio'); return }

    if (!editing) {
      const idClean = country.formatTaxId(form.taxId)
      if (!idClean || idClean.length < 5) { setFormError(`${country.taxIdLabel} inválido`); return }
      const validation = country.validateTaxId(idClean)
      if (!validation.valid) { setFormError(validation.error ?? `${country.taxIdLabel} inválido`); return }
    }

    setSaving(true)
    try {
      if (editing) {
        const res = await window.electronAPI.updateCustomer(editing.id, {
          name: form.name.trim(),
          address: form.address.trim() || undefined,
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined
        })
        if (res.success) { setEditing(null); resetForm(); await load() }
        else setFormError(res.error ?? 'Error al actualizar')
      } else {
        const res = await window.electronAPI.createCustomer({
          taxId: country.formatTaxId(form.taxId),
          name: form.name.trim(),
          address: form.address.trim() || undefined,
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined
        })
        if (res.success) { setShowCreate(false); resetForm(); await load() }
        else setFormError(res.error ?? 'Error al crear')
      }
    } catch { setFormError('Error de conexión') }
    finally { setSaving(false) }
  }

  const handleDelete = async (c: Customer): Promise<void> => {
    if (!window.confirm(`¿Eliminar "${c.name}"?`)) return
    const res = await window.electronAPI.deleteCustomer(c.id)
    if (res.success) await load()
    else setError(res.error ?? 'Error al eliminar')
  }

  const filtered = search.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.taxId.includes(search))
    : customers

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={`Buscar por ${country.taxIdLabel} o nombre...`}
          className="max-w-xs flex-1 rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink
            placeholder:text-muted-soft focus:border-primary focus:outline-none" />
        <p className="text-body-sm text-muted whitespace-nowrap">{filtered.length} de {customers.length}</p>
        <button onClick={openCreate}
          className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary transition-opacity hover:opacity-90">
          + Nuevo cliente
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
          {error} <button onClick={load} className="ml-2 underline">Reintentar</button>
        </div>
      )}

      {loading && <p className="text-body-sm text-muted-soft py-8 text-center">Cargando...</p>}

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-body-sm font-medium text-ink mb-3">Nuevo cliente</p>
          {formError && <div className="mb-3 rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{formError}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted">{country.taxIdLabel}</label>
              <input value={form.taxId} onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))}
                placeholder="J-12345678-9" autoFocus
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted">Nombre / Razón Social</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted">Teléfono</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-caption text-muted">Dirección</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" onClick={() => { setShowCreate(false); resetForm() }}
              className="rounded-md border border-hairline px-3 py-1.5 text-caption text-muted hover:text-ink">Cancelar</button>
            <button type="submit" disabled={saving}
              className="rounded-md bg-primary px-3 py-1.5 text-caption text-on-primary hover:opacity-90 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-body-sm font-medium text-ink mb-3">Editar cliente</p>
          {formError && <div className="mb-3 rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{formError}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted">{country.taxIdLabel}</label>
              <p className="rounded-md border border-hairline bg-surface-soft px-3 py-2 text-body-sm text-muted">{editing.taxId}</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted">Nombre</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted">Teléfono</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted">Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-caption text-muted">Dirección</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" onClick={() => { setEditing(null); resetForm() }}
              className="rounded-md border border-hairline px-3 py-1.5 text-caption text-muted hover:text-ink">Cancelar</button>
            <button type="submit" disabled={saving}
              className="rounded-md bg-primary px-3 py-1.5 text-caption text-on-primary hover:opacity-90 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {!loading && filtered.length === 0 && (
        <p className="text-body-sm text-muted-soft py-8 text-center">
          {search ? 'No se encontraron clientes' : 'No hay clientes registrados'}
        </p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex flex-col gap-2">
          {filtered.map(c => (
            <div key={c.id}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 ${c.active ? 'border-hairline bg-surface-card' : 'border-hairline bg-surface-soft opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-caption text-muted">{c.taxId}</span>
                  <span className="text-body-sm font-medium text-ink truncate">{c.name}</span>
                </div>
                <div className="flex gap-3 text-caption text-muted-soft mt-0.5">
                  {c.phone && <span>{c.phone}</span>}
                  {c.address && <span className="truncate">{c.address}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(c)}
                  className="rounded px-2 py-1 text-caption text-muted hover:bg-surface-soft hover:text-ink">Editar</button>
                {c.active && (
                  <button onClick={() => handleDelete(c)}
                    className="rounded px-2 py-1 text-caption text-error hover:bg-error/10">Eliminar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
