import { useState, useMemo } from 'react'
import type { DocumentType, PaymentInput, Customer } from '@shared/types'
import type { CartEntry } from '../organisms/ShoppingCart'
import { calcCartTotals } from '../molecules/calcCartTotals'
import { useCountry } from '../../shared/hooks/useCountry'
import CustomerSearch from '../molecules/CustomerSearch'
import { PERSON_TYPES, getPersonSubtypes, LEGAL_TYPES, VE_BANKS } from '@shared/types'

interface PaymentModalProps {
  entries: CartEntry[]
  usdRate: number
  documentType: DocumentType
  globalDiscount: number
  onConfirm: (data: PaymentData) => Promise<void>
  onCancel: () => void
}

export interface PaymentData {
  payments: PaymentInput[]
  globalDiscount?: number
  notes?: string
  customerId?: string
  motivo?: string
  customerNotes?: string
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
  bank: string
}

const CARD_METHODS = ['DEBIT_CARD', 'CREDIT_CARD']

let rowId = 0

export default function PaymentModal({ entries, usdRate, documentType, globalDiscount, onConfirm, onCancel }: PaymentModalProps): JSX.Element {
  const [rows, setRows] = useState<PaymentRow[]>([
    { key: ++rowId, method: 'CASH', amount: '', reference: '', bank: '' }
  ])
  const [discount, setDiscount] = useState(String(globalDiscount || ''))
  const [notes, setNotes] = useState('')
  const [motivo, setMotivo] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ rifPrefix: 'V', rifNumber: '', name: '', personType: 'V', personSubtype: 'contribuyente', legalType: '', phone: '', address: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isFactura = documentType === 'FACTURA'
  const { currencySymbol, defaultExchangeRate, taxIdLabel } = useCountry()
  const isDualCurrency = defaultExchangeRate !== null && defaultExchangeRate > 0

  const discountNum = parseFloat(discount) || 0
  const { subtotalUsd, taxTotalUsd, discountTotalUsd, totalUsd } = calcCartTotals(entries, discountNum)
  const totalBs = totalUsd * usdRate

  const paymentsTotal = useMemo(() => {
    return rows.reduce((sum, r) => {
      const amt = parseFloat(r.amount) || 0
      return sum + (r.method === 'DIVISA' ? amt * usdRate : amt)
    }, 0)
  }, [rows, usdRate])

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
        return prev.map(r => r.key === empty.key ? { ...r, method, bank: '' } : r)
      }
      return [...prev, { key: ++rowId, method, amount: '', reference: '', bank: '' }]
    })
  }

  const activeRows = rows.filter(r => (parseFloat(r.amount) || 0) > 0)

  const handleSubmit = async (): Promise<void> => {
    setError('')

    if (isFactura && !customer) {
      setError('Debe seleccionar o crear un cliente para emitir una factura')
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
        payments: activeRows.map(r => {
          const rawAmount = parseFloat(r.amount) || 0
          return {
            method: r.method,
            amountBs: r.method === 'DIVISA' ? rawAmount * usdRate : rawAmount,
            reference: r.reference.trim() || undefined,
            bank: (CARD_METHODS.includes(r.method) || r.method === 'TRANSFER') && r.bank ? r.bank : undefined
          }
        }),
        globalDiscount: discountNum > 0 ? discountNum : undefined,
        notes: notes.trim() || undefined,
        customerId: customer?.id,
        motivo: motivo.trim() || undefined,
        customerNotes: customerNotes.trim() || undefined
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCustomer = async (): Promise<void> => {
    try {
      if (!newCustomer.rifNumber.trim() || newCustomer.rifNumber.trim().length < 7) {
        setError(`Complete el ${taxIdLabel} (prefijo + 8 dígitos)`)
        return
      }
      if (!newCustomer.name.trim()) {
        setError('Nombre del cliente requerido')
        return
      }
      const fullRif = `${newCustomer.rifPrefix}-${newCustomer.rifNumber.padStart(8, '0')}`
      const res = await window.electronAPI.createCustomer({
        taxId: fullRif,
        name: newCustomer.name.trim(),
        personType: newCustomer.personType,
        personSubtype: newCustomer.personSubtype || 'contribuyente',
        legalType: newCustomer.legalType || undefined,
        phone: newCustomer.phone.trim() || undefined,
        address: newCustomer.address.trim() || undefined,
        email: newCustomer.email.trim() || undefined
      })
      if (res.success && res.data) {
        setCustomer(res.data as Customer)
        setShowCreateCustomer(false)
        setNewCustomer({ rifPrefix: 'V', rifNumber: '', name: '', personType: 'V', personSubtype: 'contribuyente', legalType: '', phone: '', address: '', email: '' })
      } else {
        setError(res.error ?? 'Error al crear cliente')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cliente')
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

            <div className="space-y-1.5 overflow-y-auto flex-1 mb-4">
              {entries.map(e => (
                <div key={e.product.id} className="flex justify-between text-body-sm">
                  <span className="text-muted truncate mr-2">{e.quantity}x {e.product.name}</span>
                  {isDualCurrency ? (
                    <span className="text-ink shrink-0">{currencySymbol} {(e.product.priceUsd * e.quantity * usdRate).toFixed(2)}</span>
                  ) : (
                    <span className="text-ink shrink-0">${(e.product.priceUsd * e.quantity).toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-hairline pt-3 space-y-1">
              {isDualCurrency ? (
                <>
                  <Row label="Subtotal" value={`${currencySymbol} ${(subtotalUsd * usdRate).toFixed(2)}`} />
                  {discountTotalUsd > 0 && (
                    <Row label="Descuento" value={`−${currencySymbol} ${(discountTotalUsd * usdRate).toFixed(2)}`} valueClass="text-success" />
                  )}
                  <Row label="Impuestos" value={`${currencySymbol} ${(taxTotalUsd * usdRate).toFixed(2)}`} />
                  <div className="flex justify-between text-body-sm font-bold pt-1 border-t border-hairline">
                    <span className="text-ink">Total</span>
                    <div className="text-right">
                      <div className="text-ink">{currencySymbol} {totalBs.toFixed(2)}</div>
                      <div className="text-caption text-muted-soft">${totalUsd.toFixed(2)} USD</div>
                    </div>
                  </div>
                  <Row label="Tasa" value={`${currencySymbol} ${usdRate.toFixed(2)}`} muted />
                </>
              ) : (
                <>
                  <Row label="Subtotal" value={`$${subtotalUsd.toFixed(2)}`} />
                  {discountTotalUsd > 0 && (
                    <Row label="Descuento" value={`−$${discountTotalUsd.toFixed(2)}`} valueClass="text-success" />
                  )}
                  <Row label="Impuestos" value={`$${taxTotalUsd.toFixed(2)}`} />
                  <div className="flex justify-between text-body-sm font-bold pt-1 border-t border-hairline">
                    <span className="text-ink">Total</span>
                    <div className="text-right">
                      <div className="text-ink">${totalUsd.toFixed(2)}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Customer + Payment */}
          <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto min-w-0">
            {error && (
              <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>
            )}

            {/* Customer section — only for FACTURA */}
            {isFactura && (
              <div>
                <h3 className="text-title-sm text-ink mb-2">Cliente</h3>
                {showCreateCustomer ? (
                  <div className="space-y-2 rounded-lg border border-hairline bg-surface-soft/50 p-3">
                    {/* RIF partido: prefijo + número sin guión */}
                    <div className="flex gap-2">
                      <select value={newCustomer.rifPrefix}
                        onChange={e => setNewCustomer({ ...newCustomer, rifPrefix: e.target.value, personType: e.target.value })}
                        className="w-16 shrink-0 rounded-md border border-hairline bg-canvas px-2 py-2 text-body-sm text-ink text-center font-mono font-bold focus:border-primary focus:outline-none">
                        {PERSON_TYPES.map(pt => (
                          <option key={pt.value} value={pt.value}>{pt.value}</option>
                        ))}
                      </select>
                      <input type="text" value={newCustomer.rifNumber}
                        onChange={e => setNewCustomer({ ...newCustomer, rifNumber: e.target.value.replace(/[^0-9]/g, '') })}
                        placeholder="12345678" maxLength={8}
                        className="flex-1 rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink font-mono focus:border-primary focus:outline-none"
                        autoFocus />
                    </div>
                    <input type="text" value={newCustomer.name}
                      onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      placeholder="Nombre o razón social"
                      className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
                    <select value={newCustomer.personSubtype}
                      onChange={e => setNewCustomer({ ...newCustomer, personSubtype: e.target.value })}
                      className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none">
                      <option value="">Subtipo de contribuyente</option>
                      {getPersonSubtypes(newCustomer.personType).map(st => (
                        <option key={st.value} value={st.value}>{st.label}</option>
                      ))}
                    </select>
                    {newCustomer.personType === 'J' && (
                      <select value={newCustomer.legalType}
                        onChange={e => setNewCustomer({ ...newCustomer, legalType: e.target.value })}
                        className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none">
                        <option value="">Tipo de sociedad (opcional)</option>
                        {LEGAL_TYPES.map(lt => (
                          <option key={lt.value} value={lt.value}>{lt.label}</option>
                        ))}
                      </select>
                    )}
                    <input type="text" value={newCustomer.phone}
                      onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      placeholder="Teléfono"
                      className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
                    <input type="text" value={newCustomer.address}
                      onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      placeholder="Dirección (opcional)"
                      className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
                    <input type="email" value={newCustomer.email}
                      onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      placeholder="Correo electrónico (opcional)"
                      className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
                    <div className="flex gap-2">
                      <button onClick={() => setShowCreateCustomer(false)}
                        className="rounded-md border border-hairline px-3 py-1.5 text-caption text-muted">Cancelar</button>
                      <button onClick={handleCreateCustomer}
                        className="rounded-md bg-primary px-3 py-1.5 text-caption text-on-primary">Crear cliente</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <CustomerSearch onSelect={setCustomer} selectedCustomer={customer} />
                    </div>
                    <button onClick={() => setShowCreateCustomer(true)}
                      className="shrink-0 rounded-md border border-hairline px-3 py-2 text-caption text-muted hover:text-primary hover:border-primary">
                      + Nuevo
                    </button>
                  </div>
                )}
              </div>
            )}

            <h3 className="text-title-sm text-ink">Pago</h3>

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
                  usdRate={usdRate}
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
              <span className="text-body-sm font-medium text-ink">{currencySymbol} {paymentsTotal.toFixed(2)}</span>
            </div>

            {Math.abs(remaining) > 0.01 && (
              <div className="rounded-lg bg-warning/5 px-4 py-2.5 flex justify-between -mt-2">
                <span className="text-body-sm text-warning font-medium">
                  {remaining > 0 ? 'Faltante' : 'Excedente'}
                </span>
                <span className="text-body-sm font-bold text-warning">
                  {currencySymbol} {Math.abs(remaining).toFixed(2)}
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
                <label className="text-caption text-muted">Motivo</label>
                <input value={motivo} onChange={e => setMotivo(e.target.value)}
                  className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none"
                  placeholder="Contado, Crédito, Pedido #..." />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-caption text-muted">Notas internas</label>
                <input value={notes} onChange={e => setNotes(e.target.value)}
                  className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none"
                  placeholder="Observaciones..." />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-caption text-muted">Notas al cliente</label>
                <input value={customerNotes} onChange={e => setCustomerNotes(e.target.value)}
                  className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none"
                  placeholder="Visible en el recibo..." />
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
            {saving ? 'Procesando...' : `Cobrar ${currencySymbol} ${totalBs.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function PaymentRowComponent({ row, remaining, usdRate, onUpdate, onRemove, showRemove }: {
  row: PaymentRow
  remaining: number
  usdRate: number
  onUpdate: (key: number, field: keyof PaymentRow, value: string) => void
  onRemove: (key: number) => void
  showRemove: boolean
}) {
  const { currencySymbol } = useCountry()
  const method = METHODS.find(m => m.id === row.method)
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="w-24 shrink-0 text-body-sm font-medium text-ink truncate" title={method?.label ?? row.method}>
        {method?.label ?? row.method}
      </span>
      <div className="flex-1 flex items-center gap-1 min-w-0">
        <input
          type="number" step="0.01" min="0"
          value={row.amount}
          onChange={e => onUpdate(row.key, 'amount', e.target.value)}
          className="w-24 min-w-0 rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none"
          placeholder={row.method === 'DIVISA' ? '$ 0.00' : `${currencySymbol} ${remaining.toFixed(2)}`}
          autoFocus
        />
        {row.method === 'DIVISA' && (
          <span className="text-caption text-muted-soft shrink-0 ml-1">
            ≈ {currencySymbol} {((parseFloat(row.amount) || 0) * usdRate).toFixed(2)}
          </span>
        )}
        {CARD_METHODS.includes(row.method) && (
          <select value={row.bank} onChange={e => onUpdate(row.key, 'bank', e.target.value)}
            className="w-auto min-w-0 rounded-md border border-hairline bg-canvas px-2 py-2 text-caption text-ink focus:border-primary focus:outline-none">
            <option value="">Banco</option>
            {VE_BANKS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        )}
        {row.method === 'TRANSFER' && (
          <>
            <select value={row.bank} onChange={e => onUpdate(row.key, 'bank', e.target.value)}
              className="w-auto min-w-0 rounded-md border border-hairline bg-canvas px-2 py-2 text-caption text-ink focus:border-primary focus:outline-none">
              <option value="">Banco</option>
              {VE_BANKS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
            <input type="text" value={row.reference}
              onChange={e => onUpdate(row.key, 'reference', e.target.value)}
              className="w-24 min-w-0 rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none"
              placeholder="Nro. ref" />
          </>
        )}
      </div>
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
