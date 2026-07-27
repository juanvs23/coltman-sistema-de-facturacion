import { useState, useEffect } from 'react'
import { useCountry } from '@renderer/shared/hooks/useCountry'
import type { ShiftConfigData } from '@shared/types'

function nowDateInput(): string {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
function nowTimeInput(): string {
  return new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false })
}

interface OpenRegisterModalProps {
  turno: number
  onConfirm: (data: { balance: number; shiftConfigId?: string; date: string; time: string }) => Promise<void>
  onCancel: () => void
}

export default function OpenRegisterModal({ turno, onConfirm, onCancel }: OpenRegisterModalProps): JSX.Element {
  const [balance, setBalance] = useState('')
  const [date, setDate] = useState(nowDateInput)
  const [time, setTime] = useState(nowTimeInput)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [shiftConfigs, setShiftConfigs] = useState<ShiftConfigData[]>([])
  const [selectedShiftId, setSelectedShiftId] = useState('')
  const { currencySymbol } = useCountry()

  useEffect(() => {
    window.electronAPI.listShiftConfigs().then(res => {
      if (res.success && res.data?.length) setShiftConfigs(res.data)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const num = parseFloat(balance)
    if (!num || num < 0) { setError('Ingrese un monto válido'); return }
    setSaving(true)
    try {
      await onConfirm({ balance: num, shiftConfigId: selectedShiftId || undefined, date, time })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-surface-card p-6 shadow-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-title-sm text-ink mb-1">Abrir caja — Turno {turno}</h3>
        <p className="text-caption text-muted mb-4">Ingrese los datos de apertura</p>
        {error && <div className="mb-3 rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>}

        {/* Shift selector */}
        {shiftConfigs.length > 0 && (
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-caption text-muted">Tipo de turno</label>
            <select value={selectedShiftId} onChange={e => setSelectedShiftId(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none">
              <option value="">Seleccione (opcional)</option>
              {shiftConfigs.map(sc => (
                <option key={sc.id} value={sc.id}>{sc.name} ({sc.startTime} - {sc.endTime})</option>
              ))}
            </select>
          </div>
        )}

        {/* Date & time */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-caption text-muted">Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-caption text-muted">Hora</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
          </div>
        </div>

        {/* Balance */}
        <div className="flex flex-col gap-1 mb-4">
          <label className="text-caption text-muted">Monto inicial ({currencySymbol})</label>
          <input type="number" step="0.01" min="0" value={balance} onChange={e => setBalance(e.target.value)}
            autoFocus placeholder="0.00"
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} disabled={saving}
            className="rounded-md border border-hairline px-4 py-2 text-body-sm text-muted hover:text-ink">Cancelar</button>
          <button type="submit" disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary hover:opacity-90 disabled:opacity-50">
            {saving ? 'Abriendo...' : `Abrir Turno ${turno}`}
          </button>
        </div>
      </form>
    </div>
  )
}
