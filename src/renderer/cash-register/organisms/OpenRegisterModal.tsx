import { useState } from 'react'
import { useCountry } from '@renderer/shared/hooks/useCountry'

interface OpenRegisterModalProps {
  onConfirm: (balance: number) => Promise<void>
  onCancel: () => void
}

export default function OpenRegisterModal({ onConfirm, onCancel }: OpenRegisterModalProps): JSX.Element {
  const [balance, setBalance] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { currencySymbol } = useCountry()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const num = parseFloat(balance)
    if (!num || num < 0) { setError('Ingrese un monto válido'); return }
    setSaving(true)
    try { await onConfirm(num) }
    catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-surface-card p-6 shadow-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-title-sm text-ink mb-4">Abrir caja</h3>
        {error && <div className="mb-3 rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>}
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
            {saving ? 'Abriendo...' : 'Abrir caja'}
          </button>
        </div>
      </form>
    </div>
  )
}
