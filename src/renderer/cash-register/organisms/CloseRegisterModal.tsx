import { useState } from 'react'
import { useCountry } from '@renderer/shared/hooks/useCountry'

function nowDateInput(): string {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
function nowTimeInput(): string {
  return new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false })
}

interface CloseRegisterModalProps {
  expectedCash: number
  onConfirm: (data: { closingBalance: number; date: string; time: string }) => Promise<void>
  onCancel: () => void
}

export default function CloseRegisterModal({ expectedCash, onConfirm, onCancel }: CloseRegisterModalProps): JSX.Element {
  const [balance, setBalance] = useState(String(expectedCash.toFixed(2)))
  const [date, setDate] = useState(nowDateInput)
  const [time, setTime] = useState(nowTimeInput)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const num = parseFloat(balance) || 0
  const diff = num - expectedCash
  const { currencySymbol } = useCountry()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!num && num !== 0) { setError('Ingrese el monto contado'); return }
    setSaving(true)
    try { await onConfirm({ closingBalance: num, date, time }) }
    catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-surface-card p-6 shadow-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-title-sm text-ink mb-1">Cerrar turno</h3>
        <p className="text-body-sm text-muted mb-4">Monto esperado: {currencySymbol} {expectedCash.toFixed(2)}</p>
        {error && <div className="mb-3 rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>}

        <div className="flex flex-col gap-1 mb-3">
          <label className="text-caption text-muted">Efectivo contado ({currencySymbol})</label>
          <input type="number" step="0.01" min="0" value={balance} onChange={e => setBalance(e.target.value)}
            autoFocus
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
        </div>

        {diff !== 0 && (
          <p className={`text-caption mb-3 ${Math.abs(diff) > 1 ? 'text-error' : 'text-success'}`}>
            Diferencia: {currencySymbol} {diff.toFixed(2)}
            {Math.abs(diff) > 1 ? ' — Verificar conteo' : ' — Aceptable'}
          </p>
        )}

        {/* Date & time */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-caption text-muted">Fecha de cierre</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-caption text-muted">Hora de cierre</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} disabled={saving}
            className="rounded-md border border-hairline px-4 py-2 text-body-sm text-muted hover:text-ink">Cancelar</button>
          <button type="submit" disabled={saving}
            className="rounded-md bg-warning px-4 py-2 text-body-sm text-on-primary hover:opacity-90 disabled:opacity-50">
            {saving ? 'Cerrando...' : 'Confirmar cierre'}
          </button>
        </div>
      </form>
    </div>
  )
}
