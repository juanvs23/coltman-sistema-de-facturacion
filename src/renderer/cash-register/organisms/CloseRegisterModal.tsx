import { useState } from 'react'

interface CloseRegisterModalProps {
  expectedCash: number
  onConfirm: (closingBalance: number) => Promise<void>
  onCancel: () => void
}

export default function CloseRegisterModal({ expectedCash, onConfirm, onCancel }: CloseRegisterModalProps): JSX.Element {
  const [balance, setBalance] = useState(String(expectedCash.toFixed(2)))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const num = parseFloat(balance) || 0
  const diff = num - expectedCash

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!num && num !== 0) { setError('Ingrese el monto contado'); return }
    setSaving(true)
    try { await onConfirm(num) }
    catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-surface-card p-6 shadow-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-title-sm text-ink mb-1">Cerrar caja</h3>
        <p className="text-body-sm text-muted mb-4">Monto esperado: Bs. {expectedCash.toFixed(2)}</p>
        {error && <div className="mb-3 rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>}
        <div className="flex flex-col gap-1 mb-2">
          <label className="text-caption text-muted">Efectivo contado (Bs.)</label>
          <input type="number" step="0.01" min="0" value={balance} onChange={e => setBalance(e.target.value)}
            autoFocus
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
        </div>
        {diff !== 0 && (
          <p className={`text-caption mb-4 ${Math.abs(diff) > 1 ? 'text-error' : 'text-success'}`}>
            Diferencia: Bs. {diff.toFixed(2)}
            {Math.abs(diff) > 1 ? ' — Verificar conteo' : ' — Diferencia aceptable'}
          </p>
        )}
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
