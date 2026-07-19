import type { Sale } from '@shared/types'

interface ReceiptConfirmProps {
  sale: Sale
  onNewSale: () => void
}

export default function ReceiptConfirm({ sale, onNewSale }: ReceiptConfirmProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-surface-card p-6 shadow-lg text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <svg className="h-7 w-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="text-title-sm text-ink">Venta completada</h3>
        <p className="mt-1 text-body-sm text-muted">Factura #{(sale as unknown as { receiptNumber: number }).receiptNumber}</p>

        <div className="my-4 border-t border-b border-hairline py-3 space-y-1">
          <div className="flex justify-between text-body-sm">
            <span className="text-muted">Subtotal</span>
            <span className="text-ink">Bs. {sale.subtotal.toFixed(2)}</span>
          </div>
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
