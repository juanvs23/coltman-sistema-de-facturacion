import type { Sale } from '@shared/types'

interface SaleDetailModalProps {
  sale: Sale
  onClose: () => void
  onCancel?: () => void
  currentUserId?: string
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo', TRANSFER: 'Transferencia', DEBIT_CARD: 'Débito',
  CREDIT_CARD: 'Crédito', DIVISA: 'Divisa', MIXED: 'Mixto'
}

export default function SaleDetailModal({ sale, onClose, onCancel, currentUserId }: SaleDetailModalProps): JSX.Element {
  const date = new Date(sale.createdAt)
  const canCancel = sale.status === 'COMPLETED' && sale.userId === currentUserId && !!onCancel

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-surface-card p-6 shadow-lg"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-title-sm text-ink">
              {sale.documentType === 'FACTURA' ? 'Factura' : 'Ticket'} N° {String(sale.receiptNumber).padStart(4, '0')}
            </h3>
            <p className="text-caption text-muted">
              {date.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}
              {' · '}
              {date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={onClose}
            className="rounded-md border border-hairline px-3 py-1 text-caption text-muted hover:text-ink">
            Cerrar
          </button>
        </div>

        {/* Customer */}
        <div className="mb-4 rounded-md bg-surface-soft px-3 py-2">
          <p className="text-caption text-muted">Cliente</p>
          {sale.customer ? (
            <>
              <p className="text-body-sm font-medium text-ink">{sale.customer.name}</p>
              <p className="text-caption text-muted font-mono">{sale.customer.taxId}</p>
            </>
          ) : (
            <p className="text-body-sm text-muted-soft">Consumidor Final</p>
          )}
        </div>

        {/* Items */}
        <div className="mb-4">
          <p className="text-caption text-muted mb-2">Productos</p>
          {sale.items.map((item, i) => (
            <div key={i} className="flex justify-between text-body-sm py-1 border-b border-hairline/50 last:border-0">
              <span className="text-ink">{item.quantity}x {item.product?.name ?? '—'}</span>
              <div className="text-right">
                <span className="text-ink">${((item.priceUsd ?? 0) * item.quantity).toFixed(2)}</span>
                {(item.discount ?? 0) > 0 && (
                  <span className="text-caption text-success block">−${item.discount.toFixed(2)}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-hairline pt-3 space-y-1">
          <div className="flex justify-between text-body-sm">
            <span className="text-muted">Subtotal</span>
            <span className="text-ink">Bs. {sale.subtotal.toFixed(2)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-body-sm">
              <span className="text-success">Descuento</span>
              <span className="text-success">−Bs. {sale.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-body-sm">
            <span className="text-muted">IVA</span>
            <span className="text-ink">Bs. {sale.taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-body-sm font-bold border-t border-hairline pt-2">
            <span className="text-ink">Total</span>
            <span className="text-ink">Bs. {sale.total.toFixed(2)}</span>
          </div>
          {sale.usdRate && sale.usdRate > 0 && (
            <div className="flex justify-between text-caption text-muted-soft">
              <span>Equiv. USD</span>
              <span>${(sale.total / sale.usdRate).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="mt-4 border-t border-hairline pt-3 space-y-1">
          <div className="flex justify-between text-caption">
            <span className="text-muted">Método</span>
            <span className="text-ink">{METHOD_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-caption">
            <span className="text-muted">Vendedor</span>
            <span className="text-ink">{sale.user?.fullName ?? '—'}</span>
          </div>
          <div className="flex justify-between text-caption">
            <span className="text-muted">Tasa USD</span>
            <span className="text-ink">Bs. {(sale.usdRate ?? 0).toFixed(2)}</span>
          </div>
          {sale.notes && (
            <div className="flex justify-between text-caption">
              <span className="text-muted">Notas</span>
              <span className="text-ink italic">{(sale as { notes: string }).notes}</span>
            </div>
          )}
          {sale.status === 'CANCELLED' && (
            <div className="rounded-md bg-error/10 px-3 py-2 mt-2">
              <p className="text-caption text-error font-medium">Anulada</p>
              {sale.cancelledAt && (
                <p className="text-[10px] text-muted-soft">
                  {new Date(sale.cancelledAt).toLocaleString('es-VE')}
                </p>
              )}
            </div>
          )}
        </div>

        {canCancel && (
          <div className="mt-4 flex justify-end">
            <button onClick={onCancel}
              className="rounded-md border border-error px-4 py-2 text-body-sm text-error hover:bg-error/10">
              Anular venta
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
