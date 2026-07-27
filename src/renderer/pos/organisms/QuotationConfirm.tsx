import type { QuotationData } from '@shared/types'
import { useCountry } from '../../shared/hooks/useCountry'

interface QuotationConfirmProps {
  quotation: QuotationData
  onNewQuotation: () => void
}

export default function QuotationConfirm({ quotation, onNewQuotation }: QuotationConfirmProps): JSX.Element {
  const { currencySymbol } = useCountry()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-canvas p-6 shadow-lg">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-title-md font-semibold text-ink">Presupuesto Generado</h2>
          <p className="text-body-sm text-muted mt-1">Presupuesto N° {quotation.number}</p>
        </div>

        <div className="mb-4 space-y-2 rounded-lg bg-surface-soft p-4">
          <div className="flex justify-between text-body-sm">
            <span className="text-muted">Subtotal:</span>
            <span className="font-medium text-ink">{currencySymbol} {quotation.subtotal.toFixed(2)}</span>
          </div>
          {quotation.discount > 0 && (
            <div className="flex justify-between text-body-sm">
              <span className="text-muted">Descuento:</span>
              <span className="font-medium text-success">-{currencySymbol} {quotation.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-body-sm">
            <span className="text-muted">IVA:</span>
            <span className="font-medium text-ink">{currencySymbol} {quotation.taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-hairline pt-2 text-body-sm font-semibold">
            <span className="text-ink">Total:</span>
            <span className="text-ink">{currencySymbol} {quotation.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-caption text-muted pt-1">
            <span>Válido hasta:</span>
            <span>{new Date(quotation.validUntil).toLocaleDateString('es-ES')}</span>
          </div>
        </div>

        <button
          onClick={onNewQuotation}
          className="w-full rounded-lg bg-primary py-3 text-body-sm font-medium text-on-primary
            transition-opacity hover:opacity-90"
        >
          Nuevo Presupuesto
        </button>
      </div>
    </div>
  )
}
