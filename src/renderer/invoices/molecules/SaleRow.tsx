import type { Sale } from '@shared/types'

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo', TRANSFER: 'Transferencia', DEBIT_CARD: 'Debito',
  CREDIT_CARD: 'Credito', DIVISA: 'Divisa'
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-success/10 text-success',
  CANCELLED: 'bg-error/10 text-error',
  ACTIVE: 'bg-warning/10 text-warning',
  REFUNDED: 'bg-muted/10 text-muted-soft'
}

interface SaleRowProps {
  sale: Sale
  onViewDetail: () => void
  onCancel?: () => void
}

export default function SaleRow({ sale, onViewDetail, onCancel }: SaleRowProps): JSX.Element {
  const date = new Date(sale.createdAt)
  const customerName = sale.customer?.name || (sale.documentType === 'FACTURA' ? '—' : 'Consumidor Final')
  const isCancelled = sale.status === 'CANCELLED'

  return (
    <tr className={`border-b border-hairline transition-colors hover:bg-surface-soft/50 ${isCancelled ? 'opacity-50' : ''}`}>
      <td className="px-4 py-3 text-body-sm font-mono text-ink">#{String(sale.receiptNumber).padStart(4, '0')}</td>
      <td className="px-4 py-3">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
          sale.documentType === 'FACTURA' ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted'
        }`}>
          {sale.documentType === 'FACTURA' ? 'FAC' : 'TKT'}
        </span>
      </td>
      <td className="px-4 py-3 text-body-sm text-ink max-w-[160px] truncate">{customerName}</td>
      <td className="px-4 py-3 text-caption text-muted">
        {sale.payments && sale.payments.length > 0
          ? sale.payments.map(p => METHOD_LABELS[p.method] ?? p.method).join(', ')
          : '—'}
      </td>
      <td className="px-4 py-3 text-body-sm font-medium text-ink text-right">
        ${sale.total.toFixed(2)}
        <span className="block text-caption text-muted-soft">Bs. {((sale.usdRate ?? 0) > 0 ? sale.total / (sale.usdRate ?? 1) : 0).toFixed(2)}</span>
      </td>
      <td className="px-4 py-3 text-caption text-muted">{sale.user?.fullName ?? '—'}</td>
      <td className="px-4 py-3 text-caption text-muted">
        {date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
        <span className="block text-[10px] text-muted-soft">{date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[sale.status] ?? 'bg-muted/10 text-muted'}`}>
          {sale.status === 'COMPLETED' ? 'Completada' : sale.status === 'CANCELLED' ? 'Anulada' : sale.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <button onClick={onViewDetail}
            className="rounded px-2 py-1 text-caption text-primary hover:bg-primary/10">
            Ver
          </button>
          {onCancel && !isCancelled && (
            <button onClick={onCancel}
              className="rounded px-2 py-1 text-caption text-error hover:bg-error/10">
              Anular
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
