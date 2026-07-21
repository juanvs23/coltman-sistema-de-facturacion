import { useState, useMemo } from 'react'
import type { DocumentType, PaymentInput } from '@shared/types'
import type { CartEntry } from '../organisms/ShoppingCart'
import { calcCartTotals } from '../molecules/calcCartTotals'

interface PaymentModalProps {
  entries: CartEntry[]
  usdRate: number
  documentType: DocumentType
  customerId?: string
  globalDiscount: number
  onConfirm: (data: PaymentData) => Promise<void>
  onCancel: () => void
}

export interface PaymentData {
  payments: PaymentInput[]
  globalDiscount?: number
  notes?: string
}

const METHODS: { id: string; label: string }[] = [
  { id: 'CASH', label: 'Efectivo' },
  { id: 'TRANSFER', label: 'Transferencia' },
  { id: 'DEBIT_CARD', label: 'Debito' },
  { id: 'CREDIT_CARD', label: 'Credito' },
  { id: 'DIVISA', label: 'Divisa (USD)' },
]

interface PaymentRow {
  key: number
  method: string
  amount: string
  reference: string
}

let rowId = 0

export default function PaymentModal({ entries, usdRate, documentType, customerId, globalDiscount, onConfirm, onCancel }: PaymentModalProps): JSX.Element {
  const [rows, setRows] = useState<PaymentRow[]>([
    { key: ++rowId, method: 'CASH', amount: '', reference: '' }
  ])
  const [discount, setDiscount] = useState(String(globalDiscount || ''))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isFactura = documentType === 'FACTURA'

  const discountNum = parseFloat(discount) || 0
  const { subtotalUsd, taxTotalUsd, discountTotalUsd, totalUsd } = calcCartTotals(entries, discountNum)
  const totalBs = totalUsd * usdRate

  const paymentsTotal = useMemo(() => {
    return rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
  }, [rows])

  const remaining = totalBs - paymentsTotal

  const updateRow = (key: number, field: keyof PaymentRow, value: string): void => {
    setRows(prev => prev.map(r => r.key === key ? { ...r, [field]: value } : r))
  }

  const removeRow = (key: number): void => {
    setRows(prev => {
      const filtered = prev.filter(r => r.key !== key)
      return filtered.length === 0 ? [{ key: ++rowId, method: 'CASH', amount: '', reference: '' }] : filtered
    })
  }

  const addMethod = (method: string): void => {
    setRows(prev => {
      const empty = prev.find(r => (parseFloat(r.amount) || 0) === 0)
      if (empty) {
        return prev.map(r => r.key === empty.key ? { ...r, method } : r)
      }
      return [...prev, { key: ++rowId, method, amount: '', reference: '' }]
    })
  }

  const activeRows = rows.filter(r => (parseFloat(r.amount) || 0) > 0)

  const handleSubmit = async (): Promise<void> => {
    setError('')

    if (isFactura && !customerId) {
      setError('Debe seleccionar un cliente para emitir una factura')
      return
    }

    if (activeRows.length === 0) {
      setError('Debe ingresar al menos un metodo de pago')
      return
    }

    if (Math.abs(remaining) > 1) {
      setError('Los pagos deben sumar el total de la venta')
      return
    }

    setSaving(true)
    try {
      await onConfirm({
        payments: activeRows.map(r => ({
          method: r.method,
          amountBs: parseFloat(r.amount),
          reference: r.reference.trim() || undefined
        })),
        globalDiscount: discountNum > 0 ? discountNum : undefined,
        notes: notes.trim() || undefined
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex flex-col w-full max-w-4xl h-[80vh] rounded-xl bg-canvas shadow-2xl overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Order summary */}
          <div className="w-80 shrink-0 bg-surface-soft/50 p-6 border-r border-hairline flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-title-sm text-ink">Resumen</h3>
              <span className={`rounded px-2 py-0.5 text-caption font-medium ${isFactura ? 'bg-primary/10 text-primary' : 'bg-surface-strong text-muted'}`}>
                {isFactura ? 'FACTURA' : 'TICKET'}
              </span>
            </div>

            {isFactura && !customerId && (
              <div className="rounded-md bg-warning/10 px-3 py-2 text-caption text-warning mb-3">
                Cliente requerido para factura
              </div>
            )}

            <div className="space-y-1.5 overflow-y-auto flex-1 mb-4">
              {entries.map(e => (
                <div key={e.product.id} className="flex justify-between text-body-sm">
                  <span className="text-muted truncate mr-2">{e.quantity}x {e.product.name}</span>
                  <span className="text-ink shrink-0">${(e.product.priceUsd * e.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-hairline pt-3 space-y-1">
              <Row label="Subtotal" value={`$${subtotalUsd.toFixed(2)}`} />
              {discountTotalUsd > 0 && (
                <Row label="Descuento" value={`−$${discountTotalUsd.toFixed(2)}`} valueClass="text-success" />
              )}
              <Row label="Impuestos" value={`$${taxTotalUsd.toFixed(2)}`} />
              <div className="flex justify-between text-body-sm font-bold pt-1 border-t border-hairline">
                <span className="text-ink">Total</span>
                <div className="text-right">
                  <div className="text-ink">${totalUsd.toFixed(2)}</div>
                  <div className="text-caption text-muted-soft">Bs. {totalBs.toFixed(2)}</div>
                </div>
              </div>
              <Row label="Tasa" value={`Bs. ${usdRate.toFixed(2)}`} muted />
            </div>
          </div>

          {/* Right: Payment */}
          <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
            <h3 className="text-title-sm text-ink">Pago</h3>

            {error && (
              <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>
            )}

            {/* Method pills */}
            <div>
              <p className="text-caption text-muted mb-2">Seleccionar metodo</p>
              <div className="flex flex-wrap gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => addMethod(m.id)}
                    className={`rounded-lg border px-3 py-2 text-body-sm font-medium transition-colors ${
                      rows.some(r => r.method === m.id && (parseFloat(r.amount) || 0) > 0)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-hairline bg-canvas text-muted hover:border-primary hover:text-primary'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment rows */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {rows.map((row) => (
                <PaymentRowComponent
                  key={row.key}
                  row={row}
                  remaining={remaining}
                  onUpdate={updateRow}
                  onRemove={removeRow}
                  showRemove={activeRows.length > 1}
                />
              ))}
              {activeRows.length > 0 && remaining > 0.01 && (
                <button
                  type="button"
                  onClick={() => setRows(prev => [...prev, { key: ++rowId, method: 'CASH', amount: '', reference: '' }])}
                  className="rounded-md border border-dashed border-muted px-3 py-2 text-caption text-muted hover:text-primary hover:border-primary w-full"
                >
                  + Agregar metodo
                </button>
              )}
            </div>

            {/* Payment totals */}
            <div className="rounded-lg bg-surface-soft/50 px-4 py-2.5 flex justify-between">
              <span className="text-body-sm text-muted">Pagado</span>
              <span className="text-body-sm font-medium text-ink">Bs. {paymentsTotal.toFixed(2)}</span>
            </div>

            {Math.abs(remaining) > 0.01 && (
              <div className="rounded-lg bg-warning/5 px-4 py-2.5 flex justify-between -mt-2">
                <span className="text-body-sm text-warning font-medium">
                  {remaining > 0 ? 'Faltante' : 'Excedente'}
                </span>
                <span className="text-body-sm font-bold text-warning">
                  Bs. {Math.abs(remaining).toFixed(2)}
                </span>
              </div>
            )}

            {/* Extra fields */}
            <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-hairline">
              <div className="flex flex-col gap-1">
                <label className="text-caption text-muted">Descuento global (USD)</label>
                <input type="number" step="0.01" min="0" value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-caption text-muted">Notas</label>
                <input value={notes} onChange={e => setNotes(e.target.value)}
                  className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none"
                  placeholder="Observaciones..." />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-hairline bg-surface-soft/30">
          <button type="button" onClick={onCancel} disabled={saving}
            className="flex-1 rounded-lg border border-hairline px-4 py-2.5 text-body-sm font-medium text-muted hover:text-ink hover:bg-surface-soft transition-colors">
            Cancelar (Esc)
          </button>
          <button type="button" onClick={() => handleSubmit()} disabled={saving}
            className="flex-[2] rounded-lg bg-primary px-4 py-2.5 text-body-sm font-medium text-on-primary hover:bg-primary-active transition-colors disabled:opacity-50">
            {saving ? 'Procesando...' : `Cobrar Bs. ${totalBs.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function PaymentRowComponent({ row, remaining, onUpdate, onRemove, showRemove }: {
  row: PaymentRow
  remaining: number
  onUpdate: (key: number, field: keyof PaymentRow, value: string) => void
  onRemove: (key: number) => void
  showRemove: boolean
}) {
  const method = METHODS.find(m => m.id === row.method)
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-body-sm font-medium text-ink">
        {method?.label ?? row.method}
      </span>
      <input
        type="number" step="0.01" min="0"
        value={row.amount}
        onChange={e => onUpdate(row.key, 'amount', e.target.value)}
        className="flex-1 rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none"
        placeholder={`Bs. ${remaining.toFixed(2)}`}
        autoFocus
      />
      {row.method === 'TRANSFER' && (
        <input
          type="text"
          value={row.reference}
          onChange={e => onUpdate(row.key, 'reference', e.target.value)}
          className="w-40 rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none"
          placeholder="Nro. referencia"
        />
      )}
      {showRemove && (
        <button type="button" onClick={() => onRemove(row.key)}
          className="shrink-0 rounded p-1.5 text-muted-soft hover:text-error hover:bg-error/10 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

function Row({ label, value, valueClass = '', muted = false }: { label: string; value: string; valueClass?: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? 'text-caption text-muted-soft' : 'text-body-sm'}`}>
      <span className={muted ? '' : 'text-muted'}>{label}</span>
      <span className={valueClass || 'text-ink'}>{value}</span>
    </div>
  )
}
