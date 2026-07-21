import type { Sale } from '@shared/types'

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo', TRANSFER: 'Transferencia', DEBIT_CARD: 'Debito',
  CREDIT_CARD: 'Credito', DIVISA: 'Divisa'
}

interface ReceiptConfirmProps {
  sale: Sale
  onNewSale: () => void
}

export default function ReceiptConfirm({ sale, onNewSale }: ReceiptConfirmProps): JSX.Element {
  const isFactura = sale.documentType === 'FACTURA'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-surface-card p-6 shadow-lg text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <svg className="h-7 w-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="text-title-sm text-ink">Venta completada</h3>
        <div className="mt-1 space-y-0.5">
          <p className="text-body-sm text-muted">
            <span className={`inline-block rounded px-2 py-0.5 text-caption font-medium ${isFactura ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted'}`}>
              {isFactura ? 'FACTURA' : 'TICKET'}
            </span>
            {' N.° '}{sale.receiptNumber}
          </p>
          {isFactura && sale.customer && (
            <div className="text-caption text-muted-soft">
              <p className="font-medium text-ink">{sale.customer.name}</p>
              <p className="font-mono">{sale.customer.taxId}</p>
            </div>
          )}
          {!isFactura && (
            <p className="text-caption text-muted-soft">Consumidor Final</p>
          )}
        </div>

        <div className="my-4 border-t border-b border-hairline py-3 space-y-1">
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
          <div className="flex justify-between text-body-sm font-bold">
            <span className="text-ink">Total</span>
            <span className="text-ink">Bs. {sale.total.toFixed(2)}</span>
          </div>
          {sale.usdRate && sale.usdRate > 0 && (
            <div className="flex justify-between text-caption text-muted-soft">
              <span>USD</span>
              <span>${(sale.total / sale.usdRate).toFixed(2)}</span>
            </div>
          )}
          {sale.payments && sale.payments.length > 0 && (
            <div className="border-t border-hairline pt-2 mt-1 space-y-1">
              <p className="text-caption text-muted text-left">Metodo de pago</p>
              {sale.payments.map(p => (
                <div key={p.id} className="flex justify-between text-caption">
                  <span className="text-muted">{METHOD_LABELS[p.method] ?? p.method}</span>
                  <span className="text-ink">Bs. {p.amountBs.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {sale.notes && (
            <div className="flex justify-between text-caption text-muted-soft pt-1 border-t border-hairline mt-1">
              <span>{sale.notes}</span>
            </div>
          )}
        </div>

        <button
          onClick={onNewSale}
          className="w-full rounded-lg bg-primary py-3 text-body-sm font-medium text-on-primary
            transition-opacity hover:opacity-90"
        >
          Nueva venta
        </button>
      </div>
    </div>
  )
}
