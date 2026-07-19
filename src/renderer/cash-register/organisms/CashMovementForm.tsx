import { useState } from 'react'

interface CashMovementFormProps {
  registerId: string
  userId: string
  onDone: () => void
  onCancel: () => void
}

export default function CashMovementForm({ registerId, userId, onDone, onCancel }: CashMovementFormProps): JSX.Element {
  const [type, setType] = useState('INCOME')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0) { setError('Ingrese un monto válido'); return }
    setSaving(true)
    try {
      await window.electronAPI.addCashMovement({ registerId, type, amount: num, description: description.trim() || undefined, userId })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-surface-card p-6 shadow-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-title-sm text-ink mb-4">Nuevo movimiento</h3>
        {error && <div className="mb-3 rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>}

        <div className="flex gap-2 mb-3">
          <button type="button" onClick={() => setType('INCOME')}
            className={`flex-1 rounded-md px-3 py-2 text-caption font-medium ${type === 'INCOME' ? 'bg-success/10 text-success border border-success/30' : 'border border-hairline text-muted'}`}>
            Ingreso
          </button>
          <button type="button" onClick={() => setType('EXPENSE')}
            className={`flex-1 rounded-md px-3 py-2 text-caption font-medium ${type === 'EXPENSE' ? 'bg-error/10 text-error border border-error/30' : 'border border-hairline text-muted'}`}>
            Gasto
          </button>
        </div>

        <div className="flex flex-col gap-1 mb-3">
          <label className="text-caption text-muted">Monto (Bs.)</label>
          <input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)}
            autoFocus placeholder="0.00"
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
        </div>

        <div className="flex flex-col gap-1 mb-4">
          <label className="text-caption text-muted">Descripción</label>
          <input value={description} onChange={e => setDescription(e.target.value)}
            placeholder={type === 'INCOME' ? 'Ingreso extra...' : 'Pago de servicios...'}
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} disabled={saving}
            className="rounded-md border border-hairline px-4 py-2 text-body-sm text-muted hover:text-ink">Cancelar</button>
          <button type="submit" disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary hover:opacity-90 disabled:opacity-50">
            {saving ? 'Registrando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
