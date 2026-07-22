import { useState, useEffect, useCallback } from 'react'
import { useCountry } from '../../shared/hooks/useCountry'

interface UsdRateData {
  rate: number
  source: string
  rateId: string | null
}

interface RateHistoryEntry {
  id: string
  rate: number
  source: string
  notes: string | null
  createdBy: string | null
  createdAt: string
}

export default function UsdRateTab(): JSX.Element {
  const { currencySymbol } = useCountry()
  const [rate, setRate] = useState<UsdRateData | null>(null)
  const [history, setHistory] = useState<RateHistoryEntry[]>([])
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

  const loadHistory = useCallback(async () => {
    try {
      const res = await window.electronAPI.getUsdRateHistory()
      if (res.success && res.data) {
        setHistory(res.data)
      }
    } catch { /* silencioso */ }
  }, [])

  useEffect(() => { load(); loadHistory() }, [load, loadHistory])

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
        await loadHistory()
      } else {
        setError(res.error ?? 'Error al guardar')
      }
    } catch { setError('Error de conexión') }
    finally { setSaving(false) }
  }

  const formatDate = (iso: string): string => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
  }

  const sourceLabel = (src: string): string => {
    const map: Record<string, string> = { bcv: 'BCV', enparalelo: 'EnParaleloVzla', criptodolar: 'CriptoDólar', manual: 'Manual' }
    return map[src] ?? src
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
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
                <p className="text-display-sm text-ink font-bold">{currencySymbol} {rate.rate.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-caption text-muted">Fuente</p>
                <span className="inline-block rounded-full bg-surface-soft px-3 py-1 text-caption text-muted">
                  {sourceLabel(rate.source)}
                </span>
              </div>
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={handleSave} className="rounded-lg border border-hairline bg-surface-card p-4">
            <p className="text-body-sm font-medium text-ink mb-3">Actualizar tasa</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-caption text-muted">Tasa ({currencySymbol} por USD)</label>
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

      {/* Rate history */}
      <div>
        <h4 className="text-title-sm text-ink mb-3">Historial de cambios</h4>
        {history.length === 0 ? (
          <p className="text-body-sm text-muted-soft py-4">Sin registros aún</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-hairline bg-canvas">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft/50">
                  <th className="px-4 py-2.5 text-left font-medium text-ink">Fecha</th>
                  <th className="px-4 py-2.5 text-left font-medium text-ink">Tasa</th>
                  <th className="px-4 py-2.5 text-left font-medium text-ink">Fuente</th>
                  <th className="px-4 py-2.5 text-left font-medium text-ink">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-2.5 text-muted">{formatDate(entry.createdAt)}</td>
                    <td className="px-4 py-2.5 text-ink font-medium">{currencySymbol} {entry.rate.toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full bg-surface-soft px-2 py-0.5 text-caption text-muted">
                        {sourceLabel(entry.source)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted">{entry.createdBy ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
