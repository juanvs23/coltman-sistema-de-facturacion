import { useState, useEffect, useCallback } from 'react'

interface FiscalConfigData {
  printerType: string
  printerPort: string
  printerEnabled: boolean
  seniatEnabled: boolean
  autoSendSeniat: boolean
}

const PRINTER_TYPES = [
  { value: 'bixolon', label: 'Bixolon' },
  { value: 'epson', label: 'Epson' },
  { value: 'sharp', label: 'Sharp' },
  { value: 'sam4s', label: 'SAM4s' },
]

export default function FiscalTab(): JSX.Element {
  const [config, setConfig] = useState<FiscalConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    printerType: 'bixolon',
    printerPort: 'COM1',
    printerEnabled: false,
    seniatEnabled: false,
    autoSendSeniat: false,
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.electronAPI.getFiscalConfig()
      if (res.success && res.data) {
        setConfig(res.data)
        setForm({
          printerType: res.data.printerType ?? 'bixolon',
          printerPort: res.data.printerPort ?? 'COM1',
          printerEnabled: res.data.printerEnabled ?? false,
          seniatEnabled: res.data.seniatEnabled ?? false,
          autoSendSeniat: res.data.autoSendSeniat ?? false,
        })
      } else {
        setError(res.error ?? 'Error al cargar')
      }
    } catch { setError('Error de conexion') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await window.electronAPI.updateFiscalConfig(form)
      if (res.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        await load()
      } else {
        setError(res.error ?? 'Error al guardar')
      }
    } catch { setError('Error de conexion') }
    finally { setSaving(false) }
  }

  if (loading) {
    return <p className="text-body-sm text-muted-soft py-8 text-center">Cargando...</p>
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Impresora Fiscal */}
      <section>
        <h3 className="text-title-sm text-ink mb-1">Impresora fiscal</h3>
        <p className="text-body-sm text-muted">
          Configuracion de la impresora fiscal conectada al sistema.
        </p>

        <div className="mt-4 rounded-lg border border-hairline bg-canvas p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-body-sm font-medium text-ink">Habilitar impresora fiscal</label>
            <button
              type="button"
              role="switch"
              aria-checked={form.printerEnabled}
              onClick={() => setForm({ ...form, printerEnabled: !form.printerEnabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.printerEnabled ? 'bg-success' : 'bg-surface-strong'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${form.printerEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted">Tipo de impresora</label>
              <select
                value={form.printerType}
                onChange={(e) => setForm({ ...form, printerType: e.target.value })}
                disabled={!form.printerEnabled}
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none disabled:opacity-50"
              >
                {PRINTER_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted">Puerto</label>
              <input
                type="text"
                value={form.printerPort}
                onChange={(e) => setForm({ ...form, printerPort: e.target.value })}
                disabled={!form.printerEnabled}
                placeholder="COM1, USB001..."
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SENIAT */}
      <section>
        <h3 className="text-title-sm text-ink mb-1">SENIAT</h3>
        <p className="text-body-sm text-muted">
          Configuracion para facturacion electronica ante el SENIAT.
        </p>

        <div className="mt-4 rounded-lg border border-hairline bg-canvas p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-body-sm font-medium text-ink">Facturacion electronica SENIAT</label>
              <p className="text-caption text-muted-soft">Habilita el envio automatico de facturas al SENIAT</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.seniatEnabled}
              onClick={() => setForm({ ...form, seniatEnabled: !form.seniatEnabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.seniatEnabled ? 'bg-success' : 'bg-surface-strong'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${form.seniatEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {form.seniatEnabled && (
            <div className="flex items-center justify-between pl-4 border-l-2 border-hairline">
              <div>
                <label className="text-body-sm font-medium text-ink">Envio automatico</label>
                <p className="text-caption text-muted-soft">Envia facturas automaticamente al generarlas</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.autoSendSeniat}
                onClick={() => setForm({ ...form, autoSendSeniat: !form.autoSendSeniat })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.autoSendSeniat ? 'bg-success' : 'bg-surface-strong'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${form.autoSendSeniat ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>
      )}

      {saved && (
        <div className="rounded-md bg-success/10 px-3 py-2 text-body-sm text-success">Configuracion guardada</div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary px-5 py-2.5 text-button text-on-primary transition-colors hover:bg-primary-active disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar configuracion'}
        </button>
      </div>
    </div>
  )
}
