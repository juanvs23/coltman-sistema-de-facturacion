import { useState } from 'react'
import { useCountry } from '@renderer/shared/hooks/useCountry'
import type { CartEntry } from '../organisms/ShoppingCart'

interface PaymentModalProps {
  entries: CartEntry[]
  usdRate: number
  onConfirm: (data: PaymentData) => Promise<void>
  onCancel: () => void
}

export interface PaymentData {
  paymentMethod: string
  cashAmount?: number
}

export default function PaymentModal({ entries, usdRate, onConfirm, onCancel }: PaymentModalProps): JSX.Element {
  const [method, setMethod] = useState('CASH')
  const [cashAmount, setCashAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Calculate totals
  const subtotalUsd = entries.reduce((sum, e) => sum + e.product.priceUsd * e.quantity, 0)
  const taxTotalUsd = entries.reduce((sum, e) => {
    const totalRate = (e.product.taxes ?? []).reduce((s, pt) => s + (pt.tax?.rate ?? 0), 0)
    return sum + (e.product.priceUsd * e.quantity * totalRate) / 100
  }, 0)
  const totalUsd = subtotalUsd + taxTotalUsd
  const totalBs = totalUsd * usdRate

  const cashNum = parseFloat(cashAmount) || 0
  const cashUsd = method === 'DIVISA' ? cashNum : cashNum / usdRate
  const changeUsd = method === 'CASH' ? cashNum - totalUsd : 0

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')

    if (method === 'CASH' && cashNum > 0 && cashNum < totalUsd) {
      setError('El monto recibido es menor al total')
      return
    }

    setSaving(true)
    try {
      await onConfirm({
        paymentMethod: method,
        cashAmount: method === 'CASH' || method === 'DIVISA' ? cashNum : undefined
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex w-full max-w-2xl gap-6 rounded-lg bg-surface-card p-6 shadow-lg">
        {/* Left: Cart summary */}
        <div className="flex-1">
          <h3 className="text-title-sm text-ink mb-3">Resumen de venta</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {entries.map(e => (
              <div key={e.product.id} className="flex justify-between text-body-sm">
                <span className="text-muted">{e.quantity}x {e.product.name}</span>
                <span className="text-ink">${(e.product.priceUsd * e.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-hairline mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-body-sm">
              <span className="text-muted">Subtotal</span><span className="text-ink">${subtotalUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-body-sm">
              <span className="text-muted">Impuestos</span><span className="text-ink">${taxTotalUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-body-sm font-bold">
              <span className="text-ink">Total USD</span><span className="text-ink">${totalUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-caption text-muted-soft">
              <span>Total Bs.</span><span>Bs. {totalBs.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-caption text-muted-soft">
              <span>Tasa USD</span><span>Bs. {usdRate.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right: Payment form */}
        <form onSubmit={handleSubmit} className="w-64 flex flex-col gap-4">
          <h3 className="text-title-sm text-ink">Método de pago</h3>

          {error && (
            <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {country.paymentMethods.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`rounded-md px-3 py-2 text-caption font-medium transition-colors
                  ${method === m.id
                    ? 'bg-primary text-on-primary'
                    : 'border border-hairline text-muted hover:border-primary hover:text-primary'
                  }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {(method === 'CASH' || method === 'DIVISA') && (
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted">
                {method === 'CASH' ? 'Monto recibido (USD)' : 'Monto en USD'}
              </label>
              <input
                type="number" step="0.01" min="0" value={cashAmount}
                onChange={e => setCashAmount(e.target.value)}
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink
                  focus:border-primary focus:outline-none"
                placeholder="0.00"
                autoFocus
              />
              {method === 'CASH' && cashNum > totalUsd && (
                <p className="text-caption text-success">
                  Vuelto: ${changeUsd.toFixed(2)} (Bs. {(changeUsd * usdRate).toFixed(2)})
                </p>
              )}
              {method === 'DIVISA' && (
                <p className="text-caption text-muted-soft">
                  Equivale a Bs. {(cashNum * usdRate).toFixed(2)}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-auto">
            <button type="button" onClick={onCancel} disabled={saving}
              className="flex-1 rounded-md border border-hairline px-4 py-2 text-body-sm text-muted hover:text-ink">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary hover:opacity-90 disabled:opacity-50">
              {saving ? 'Procesando...' : `Cobrar $${totalUsd.toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
