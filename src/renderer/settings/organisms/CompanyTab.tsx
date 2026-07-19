import { useState, useEffect, useCallback } from 'react'
import type { CompanyConfig } from '@shared/types'

const emptyForm: CompanyConfig = {
  businessName: '',
  taxId: '',
  address: '',
  phone: '',
  email: '',
  logo: ''
}

export default function CompanyTab(): JSX.Element {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CompanyConfig>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.electronAPI.getCompanyConfig()
      if (res.success && res.data) {
        setForm({
          businessName: res.data.businessName ?? '',
          taxId: res.data.taxId ?? '',
          address: res.data.address ?? '',
          phone: res.data.phone ?? '',
          email: res.data.email ?? '',
          logo: res.data.logo ?? ''
        })
      } else setError(res.error ?? 'Error al cargar')
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!form.businessName.trim()) { setError('La razón social es obligatoria'); return }
    setSaving(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await window.electronAPI.updateCompanyConfig({
        businessName: form.businessName.trim(),
        taxId: form.taxId?.trim() || undefined,
        address: form.address?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim() || undefined,
        logo: form.logo || undefined
      })
      if (res.success) setSuccessMsg('Datos guardados correctamente')
      else setError(res.error ?? 'Error al guardar')
    } catch { setError('Error de conexión') }
    finally { setSaving(false) }
  }

  if (loading) return <p className="text-body-sm text-muted-soft py-8 text-center">Cargando...</p>

  return (
    <div className="max-w-xl">
      <p className="text-body-sm text-muted mb-4">
        Datos del emisor que aparecerán en facturas y documentos fiscales.
      </p>

      {error && (
        <div className="mb-3 rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
          {error} <button onClick={load} className="ml-2 underline">Reintentar</button>
        </div>
      )}

      {successMsg && (
        <div className="mb-3 rounded-md bg-success/10 px-3 py-2 text-body-sm text-success">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-lg border border-hairline bg-surface-card p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-caption text-muted">Razón Social *</label>
            <input value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
              placeholder="Nombre de la empresa" autoFocus
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink
                placeholder:text-muted-soft focus:border-primary focus:outline-none" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-caption text-muted">RIF</label>
            <input value={form.taxId ?? ''} onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))}
              placeholder="J-00000000-0"
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink
                placeholder:text-muted-soft focus:border-primary focus:outline-none font-mono" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-caption text-muted">Teléfono</label>
            <input value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+58 212 1234567"
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink
                placeholder:text-muted-soft focus:border-primary focus:outline-none" />
          </div>

          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-caption text-muted">Dirección Fiscal</label>
            <input value={form.address ?? ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Av. Principal, Centro Comercial..."
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink
                placeholder:text-muted-soft focus:border-primary focus:outline-none" />
          </div>

          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-caption text-muted">Email</label>
            <input type="email" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="contacto@empresa.com"
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink
                placeholder:text-muted-soft focus:border-primary focus:outline-none" />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary hover:opacity-90 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
