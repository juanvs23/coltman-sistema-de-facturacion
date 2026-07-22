import { useState } from 'react'
import type { Sale } from '@shared/types'
import { useCountry } from '../../shared/hooks/useCountry'

interface CancelSaleModalProps {
  sale: Sale
  onConfirm: (reason: string) => Promise<void>
  onCancel: () => void
}

export default function CancelSaleModal({ sale, onConfirm, onCancel }: CancelSaleModalProps): JSX.Element {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { currencySymbol } = useCountry()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!reason.trim()) { setError('El motivo es obligatorio'); return }
    setSaving(true)
    setError('')
    try {
      await onConfirm(reason.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al anular')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <form onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg bg-surface-card p-6 shadow-lg"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-title-sm text-ink mb-1">Anular venta</h3>
        <p className="text-body-sm text-muted mb-4">
          {sale.documentType === 'FACTURA' ? 'Factura' : 'Ticket'} N° {String(sale.receiptNumber).padStart(4, '0')}
          {' — '}{currencySymbol} {sale.total.toFixed(2)}
        </p>

        {error && (
          <div className="mb-3 rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>
        )}

        <div className="flex flex-col gap-1 mb-4">
          <label className="text-caption text-muted">Motivo de anulación *</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            autoFocus
            placeholder="Error en el monto, cliente incorrecto..."
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink
              placeholder:text-muted-soft focus:border-primary focus:outline-none resize-none"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} disabled={saving}
            className="rounded-md border border-hairline px-4 py-2 text-body-sm text-muted hover:text-ink">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="rounded-md bg-error px-4 py-2 text-body-sm text-on-primary hover:opacity-90 disabled:opacity-50">
            {saving ? 'Anulando...' : 'Confirmar anulación'}
          </button>
        </div>
      </form>
    </div>
  )
}
