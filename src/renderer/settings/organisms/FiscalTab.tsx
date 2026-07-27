import { useState, useEffect, useCallback } from 'react'
import { useCountry } from '../../shared/hooks/useCountry'

interface FiscalConfigData {
  printerType: string
  printerPort: string
  printerEnabled: boolean
  seniatEnabled: boolean
  autoSendSeniat: boolean
}

interface PrinterStatus {
  online: boolean
  paperOut: boolean
  drawerOpen: boolean
}

const PRINTER_TYPES = [
  { value: 'bixolon', label: 'Bixolon' },
  { value: 'epson', label: 'Epson' },
  { value: 'sharp', label: 'Sharp' },
  { value: 'sam4s', label: 'SAM4s' },
]

const ERROR_MESSAGES: Record<string, string> = {
  PRINTER_NOT_FOUND: 'Impresora no encontrada',
  PLUGIN_NOT_AVAILABLE: 'Plugin fiscal no instalado',
  PLUGIN_NOT_ACTIVE: 'Plugin fiscal no activo',
  LICENSE_REQUIRED: 'Se requiere licencia',
  PRINT_FAILED: 'Error de impresión',
  PAPER_OUT: 'Sin papel',
}

export default function FiscalTab(): JSX.Element {
  const country = useCountry()
  const [config, setConfig] = useState<FiscalConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [hasLicense, setHasLicense] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>({
    online: false,
    paperOut: false,
    drawerOpen: false,
  })
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
      const [configRes, licenseRes] = await Promise.all([
        window.electronAPI.getFiscalConfig(),
        window.electronAPI.checkPrinterLicense(),
      ])
      if (configRes.success && configRes.data) {
        setConfig(configRes.data)
        setForm({
          printerType: configRes.data.printerType ?? 'bixolon',
          printerPort: configRes.data.printerPort ?? 'COM1',
          printerEnabled: configRes.data.printerEnabled ?? false,
          seniatEnabled: configRes.data.seniatEnabled ?? false,
          autoSendSeniat: configRes.data.autoSendSeniat ?? false,
        })
      } else {
        setError(configRes.error ?? 'Error al cargar')
      }
      if (licenseRes.success && licenseRes.data) {
        setHasLicense(licenseRes.data.valid)
      }
    } catch { setError('Error de conexion') }
    finally { setLoading(false) }
  }, [])

  const loadPrinterStatus = useCallback(async () => {
    try {
      const res = await window.electronAPI.getPrinterStatus()
      if (res.success && res.data) {
        setPrinterStatus(res.data)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!config?.printerEnabled) return
    loadPrinterStatus()
    const interval = setInterval(loadPrinterStatus, 10000)
    return () => clearInterval(interval)
  }, [config?.printerEnabled, loadPrinterStatus])

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

  const handleTestConnection = async () => {
    setTestStatus('testing')
    setTestMessage('')
    try {
      const res = await window.electronAPI.testPrinter()
      if (res.success) {
        setTestStatus('success')
        setTestMessage('Conexión exitosa')
      } else {
        setTestStatus('error')
        setTestMessage(ERROR_MESSAGES[res.error ?? ''] ?? res.error ?? 'Error desconocido')
      }
    } catch {
      setTestStatus('error')
      setTestMessage('Error de conexion')
    }
  }

  const printerToggleDisabled = !hasLicense
  const testButtonDisabled = !form.printerEnabled || testStatus === 'testing'

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
              aria-label="Habilitar impresora fiscal"
              onClick={() => !printerToggleDisabled && setForm({ ...form, printerEnabled: !form.printerEnabled })}
              disabled={printerToggleDisabled}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.printerEnabled ? 'bg-success' : 'bg-surface-strong'} ${printerToggleDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${form.printerEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Printer Status Indicator */}
          <div className="flex items-center gap-4 text-caption">
            <span className={`flex items-center gap-1 ${printerStatus.online ? 'text-success' : 'text-error'}`}>
              <span className={`inline-block h-2 w-2 rounded-full ${printerStatus.online ? 'bg-success' : 'bg-error'}`} />
              {printerStatus.online ? 'En línea' : 'Sin conexión'}
            </span>
            {printerStatus.paperOut && (
              <span className="flex items-center gap-1 text-warning">⚠ Sin papel</span>
            )}
            {printerStatus.drawerOpen && (
              <span className="flex items-center gap-1 text-muted">Cajón abierto</span>
            )}
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

          {/* Test Connection Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testButtonDisabled}
              className="rounded-md border border-hairline bg-canvas px-4 py-2 text-body-sm text-ink hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testStatus === 'testing' ? 'Probando...' : 'Probar conexión'}
            </button>
            {testStatus === 'success' && (
              <span className="text-caption text-success">{testMessage}</span>
            )}
            {testStatus === 'error' && (
              <span className="text-caption text-error">{testMessage}</span>
            )}
          </div>
        </div>
      </section>

      {country.fiscalAuthority && (
        <section>
          <h3 className="text-title-sm text-ink mb-1">{country.fiscalAuthority.name}</h3>
          <p className="text-body-sm text-muted">
            {country.fiscalAuthority.description}
          </p>

          <div className="mt-4 rounded-lg border border-hairline bg-canvas p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-body-sm font-medium text-ink">{country.fiscalAuthority.electronicInvoiceLabel}</label>
                <p className="text-caption text-muted-soft">{country.fiscalAuthority.electronicInvoiceDescription}</p>
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
                  <label className="text-body-sm font-medium text-ink">{country.fiscalAuthority.autoSendLabel}</label>
                  <p className="text-caption text-muted-soft">{country.fiscalAuthority.autoSendDescription}</p>
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
      )}

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
