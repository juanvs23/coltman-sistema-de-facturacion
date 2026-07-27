import { useState, useEffect, useCallback } from 'react'
import type { QuotationData, Sale } from '@shared/types'
import { useAuth } from '../../shared/hooks/useAuth'
import { useCountry } from '../../shared/hooks/useCountry'

type QuotationStatusType = QuotationData['status']

const STATUS_LABELS: Record<QuotationStatusType, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviado',
  CONVERTED: 'Convertido',
  EXPIRED: 'Vencido',
  CANCELLED: 'Anulado'
}

const STATUS_COLORS: Record<QuotationStatusType, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  CONVERTED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  EXPIRED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
}

export default function QuotationsPage(): JSX.Element {
  const { session } = useAuth()
  const { currencySymbol, taxIdLabel } = useCountry()
  const [quotations, setQuotations] = useState<QuotationData[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<QuotationStatusType | ''>('')
  const [selected, setSelected] = useState<QuotationData | null>(null)
  const [convertResult, setConvertResult] = useState<Sale | null>(null)
  const [converting, setConverting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const filters: Record<string, unknown> = {}
    if (statusFilter) filters.status = statusFilter
    const res = await window.electronAPI.listQuotations(filters)
    if (res.success) setQuotations(res.data ?? [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const handleConvert = async (id: string): Promise<void> => {
    if (!confirm('¿Convertir este presupuesto en una factura?')) return
    setConverting(true)
    const res = await window.electronAPI.convertQuotationToSale(id)
    if (res.success) {
      setConvertResult(res.data ?? null)
      load()
    } else {
      alert(res.error ?? 'Error al convertir')
    }
    setConverting(false)
  }

  const handleCancel = async (id: string): Promise<void> => {
    if (!confirm('¿Anular este presupuesto?')) return
    const res = await window.electronAPI.cancelQuotation(id)
    if (res.success) load()
    else alert(res.error ?? 'Error al anular')
  }

  if (convertResult) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl bg-canvas p-6 shadow-lg text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-title-md font-semibold text-ink mb-2">Factura Creada</h2>
          <p className="text-body-sm text-muted mb-1">Factura N° {convertResult.receiptNumber}</p>
          <p className="text-body-sm text-muted mb-4">{currencySymbol} {convertResult.total.toFixed(2)}</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setConvertResult(null); setSelected(null) }}
              className="flex-1 rounded-lg border border-hairline py-2.5 text-body-sm font-medium text-ink"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (selected) {
    const q = selected
    return (
      <div className="flex flex-1 flex-col overflow-hidden p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-title-md font-semibold text-ink">Presupuesto N° {q.number}</h2>
            <p className="text-body-sm text-muted">
              Creado el {new Date(q.createdAt).toLocaleDateString('es-ES')} · Válido hasta {new Date(q.validUntil).toLocaleDateString('es-ES')}
            </p>
          </div>
          <div className="flex gap-2">
            {q.status === 'DRAFT' && (
              <>
                <button
                  onClick={() => handleConvert(q.id)}
                  disabled={converting}
                  className="rounded-lg bg-primary px-4 py-2 text-body-sm font-medium text-on-primary hover:opacity-90 disabled:opacity-50"
                >
                  {converting ? 'Convirtiendo...' : 'Convertir a Factura'}
                </button>
                <button
                  onClick={() => handleCancel(q.id)}
                  className="rounded-lg border border-error px-4 py-2 text-body-sm font-medium text-error hover:bg-error/5"
                >
                  Anular
                </button>
              </>
            )}
            <button
              onClick={() => setSelected(null)}
              className="rounded-lg border border-hairline px-4 py-2 text-body-sm font-medium text-ink"
            >
              Volver
            </button>
          </div>
        </div>

        {/* Customer info */}
        {q.customer && (
          <div className="mb-4 rounded-lg border border-hairline bg-surface-soft p-3">
            <p className="text-body-sm font-medium text-ink">{q.customer.name}</p>
            <p className="text-caption text-muted">{taxIdLabel}: {q.customer.taxId}</p>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-caption text-muted">
                <th className="pb-2 font-medium">Producto</th>
                <th className="pb-2 font-medium text-right">Cant.</th>
                <th className="pb-2 font-medium text-right">Precio</th>
                <th className="pb-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {q.items.map(item => (
                <tr key={item.id} className="border-b border-hairline">
                  <td className="py-2 text-ink">{item.product?.name ?? item.productId}</td>
                  <td className="py-2 text-right text-muted">{item.quantity}</td>
                  <td className="py-2 text-right text-muted">{currencySymbol} {item.priceUsd?.toFixed(2)}</td>
                  <td className="py-2 text-right font-medium text-ink">{currencySymbol} {item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-hairline pt-3 space-y-1">
          <div className="flex justify-between text-body-sm">
            <span className="text-muted">Subtotal</span>
            <span className="text-ink">{currencySymbol} {q.subtotal.toFixed(2)}</span>
          </div>
          {q.discount > 0 && (
            <div className="flex justify-between text-body-sm">
              <span className="text-muted">Descuento</span>
              <span className="text-success">-{currencySymbol} {q.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-body-sm">
            <span className="text-muted">IVA</span>
            <span className="text-ink">{currencySymbol} {q.taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-hairline pt-2 text-body-sm font-semibold">
            <span className="text-ink">Total</span>
            <span className="text-ink">{currencySymbol} {q.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-title-md font-semibold text-ink">Presupuestos</h2>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        {(['', 'DRAFT', 'SENT', 'CONVERTED', 'EXPIRED', 'CANCELLED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-caption font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary text-on-primary'
                : 'bg-surface-soft text-muted hover:text-ink'
            }`}
          >
            {s === '' ? 'Todos' : STATUS_LABELS[s as QuotationStatusType]}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-body-sm text-muted">Cargando...</p>
        </div>
      ) : quotations.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-title-sm text-muted-soft">Sin presupuestos</p>
            <p className="text-body-sm text-muted-soft mt-1">Los presupuestos se crean desde el POS</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-caption text-muted">
                <th className="pb-3 font-medium">N°</th>
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium">Fecha</th>
                <th className="pb-3 font-medium">Válido hasta</th>
                <th className="pb-3 font-medium text-right">Total</th>
                <th className="pb-3 font-medium text-center">Estado</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q.id} className="border-b border-hairline hover:bg-surface-soft/50 cursor-pointer"
                  onClick={() => setSelected(q)}>
                  <td className="py-3 font-medium text-ink">#{q.number}</td>
                  <td className="py-3 text-muted">{q.customer?.name ?? '—'}</td>
                  <td className="py-3 text-muted">{new Date(q.createdAt).toLocaleDateString('es-ES')}</td>
                  <td className="py-3 text-muted">{new Date(q.validUntil).toLocaleDateString('es-ES')}</td>
                  <td className="py-3 text-right font-medium text-ink">{currencySymbol} {q.total.toFixed(2)}</td>
                  <td className="py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-caption font-medium ${STATUS_COLORS[q.status]}`}>
                      {STATUS_LABELS[q.status]}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {q.status === 'DRAFT' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleConvert(q.id) }}
                        disabled={converting}
                        className="text-caption font-medium text-primary hover:underline disabled:opacity-50"
                      >
                        Convertir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
