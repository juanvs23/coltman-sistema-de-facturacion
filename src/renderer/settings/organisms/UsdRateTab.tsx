import { useState, useEffect, useCallback } from 'react'

interface UsdRateData {
  rate: number
  source: string
}

export default function UsdRateTab(): JSX.Element {
  const [rate, setRate] = useState<UsdRateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editRate, setEditRate] = useState('')
  const [editSource, setEditSource] = useState('manual')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.electronAPI.getUsdRate()
      if (res.success && res.data) {
        setRate(res.data)
        setEditRate(res.data.rate.toString())
        setEditSource(res.data.source)
      } else {
        setError(res.error ?? 'Error al cargar')
      }
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const rateNum = parseFloat(editRate)
    if (isNaN(rateNum) || rateNum <= 0) {
      setError('Ingrese una tasa válida')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await window.electronAPI.updateConfig({ usdRate: rateNum, usdRateSource: editSource })
      if (res.success) {
        await load()
      } else {
        setError(res.error ?? 'Error al guardar')
      }
    } catch { setError('Error de conexión') }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <h3 className="text-title-sm text-ink">Tasa de cambio USD</h3>

      {error && (
        <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
          {error} <button onClick={load} className="ml-2 underline">Reintentar</button>
        </div>
      )}

      {loading && <p className="text-body-sm text-muted-soft py-8 text-center">Cargando...</p>}

      {rate && !loading && (
        <>
          {/* Current rate display */}
          <div className="rounded-lg border border-hairline bg-surface-card p-4">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-caption text-muted">Tasa actual</p>
                <p className="text-display-sm text-ink font-bold">Bs. {rate.rate.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-caption text-muted">Fuente</p>
                <span className="inline-block rounded-full bg-surface-soft px-3 py-1 text-caption text-muted">
                  {rate.source === 'bcv' ? 'BCV' : rate.source === 'enparalelo' ? 'EnParaleloVzla' : rate.source === 'criptodolar' ? 'CriptoDólar' : 'Manual'}
                </span>
              </div>
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={handleSave} className="rounded-lg border border-hairline bg-surface-card p-4">
            <p className="text-body-sm font-medium text-ink mb-3">Actualizar tasa</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-caption text-muted">Tasa (Bs. por USD)</label>
                <input type="number" step="0.01" min="0" value={editRate}
                  onChange={e => setEditRate(e.target.value)}
                  className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-caption text-muted">Fuente</label>
                <select value={editSource} onChange={e => setEditSource(e.target.value)}
                  className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none">
                  <option value="manual">Manual</option>
                  <option value="bcv">BCV</option>
                  <option value="enparalelo">EnParaleloVzla</option>
                  <option value="criptodolar">CriptoDólar</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button type="submit" disabled={saving}
                className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Actualizar tasa'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
