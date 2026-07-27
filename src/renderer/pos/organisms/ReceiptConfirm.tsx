import { useState, useEffect } from 'react'
import type { Sale, CompanyConfig } from '@shared/types'
import type { ReceiptData, ReceiptLine } from '@plugin-api/contracts/IFiscalPrinter'
import { useCountry } from '../../shared/hooks/useCountry'

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
  const { currencySymbol, defaultExchangeRate } = useCountry()
  const isDualCurrency = defaultExchangeRate !== null && defaultExchangeRate > 0
  const [printStatus, setPrintStatus] = useState<'idle' | 'printing' | 'success' | 'error'>('idle')
  const [company, setCompany] = useState<CompanyConfig | null>(null)

  useEffect(() => {
    window.electronAPI.getCompanyConfig().then(res => {
      if (res.success && res.data) setCompany(res.data)
    }).catch(() => {})
  }, [])

  const buildReceiptData = (): ReceiptData => {
    const header: string[] = []
    if (company?.businessName) header.push(company.businessName)
    if (company?.taxId) header.push(`${company.taxId}`)
    if (company?.address) header.push(company.address)
    if (company?.phone) header.push(`Telf: ${company.phone}`)

    const docLabel = isFactura ? 'FACTURA' : 'TICKET'
    const lines: ReceiptLine[] = [
      { type: 'separator', text: '─'.repeat(32) },
      { type: 'text', text: `${docLabel} N.° ${String(sale.receiptNumber).padStart(5, '0')}` },
      { type: 'text', text: new Date(sale.createdAt ?? Date.now()).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
    ]

    if (sale.customer) {
      lines.push({ type: 'text', text: `Cliente: ${sale.customer.name}` })
      lines.push({ type: 'text', text: `RIF: ${sale.customer.taxId}` })
    } else {
      lines.push({ type: 'text', text: 'CONSUMIDOR FINAL' })
    }

    lines.push({ type: 'separator', text: '─'.repeat(32) })
    lines.push({ type: 'text', text: 'CANT  DESCRIPCION       PRECIO' })

    for (const item of sale.items ?? []) {
      const name = item.product?.name ?? 'Producto'
      const qty = String(item.quantity).padStart(3)
      const price = currencySymbol + ' ' + (item.subtotal ?? 0).toFixed(2)
      const desc = name.length > 18 ? name.slice(0, 16) + '..' : name.padEnd(18)
      lines.push({ type: 'item', text: `${qty}  ${desc} ${price}`, quantity: item.quantity, price: item.subtotal })
    }

    lines.push({ type: 'separator', text: '─'.repeat(32) })
    lines.push({ type: 'text', text: `Subtotal:  ${currencySymbol} ${sale.subtotal.toFixed(2).padStart(10)}` })
    if (sale.discount > 0) {
      lines.push({ type: 'text', text: `Descuento: ${currencySymbol} ${sale.discount.toFixed(2).padStart(10)}` })
    }
    lines.push({ type: 'text', text: `IVA (${sale.taxRate ?? 16}%): ${currencySymbol} ${sale.taxTotal.toFixed(2).padStart(8)}` })
    lines.push({ type: 'total', text: `TOTAL:     ${currencySymbol} ${sale.total.toFixed(2).padStart(10)}`, fontSize: 'large' })

    if (isDualCurrency && sale.usdRate && sale.usdRate > 0) {
      lines.push({ type: 'text', text: `USD (${sale.usdRate.toFixed(2)}): $${(sale.total / sale.usdRate).toFixed(2)}`.padStart(32) })
    }

    if (sale.payments && sale.payments.length > 0) {
      lines.push({ type: 'separator', text: '─'.repeat(32) })
      for (const p of sale.payments) {
        lines.push({ type: 'text', text: `${METHOD_LABELS[p.method] ?? p.method}: ${currencySymbol} ${p.amountBs.toFixed(2)}` })
      }
    }

    const footer: string[] = ['Gracias por su compra']
    if (company?.businessName) footer.unshift(company.businessName)

    return { header, lines, footer }
  }

  const handlePrint = async (): Promise<void> => {
    setPrintStatus('printing')
    try {
      const receiptData = buildReceiptData()
      const res = await window.electronAPI.printReceipt(receiptData)
      if (res.success) {
        setPrintStatus('success')
      } else {
        setPrintStatus('error')
      }
    } catch {
      setPrintStatus('error')
    }
  }

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
            <span className="text-ink">{currencySymbol} {sale.subtotal.toFixed(2)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-body-sm">
              <span className="text-success">Descuento</span>
              <span className="text-success">−{currencySymbol} {sale.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-body-sm">
            <span className="text-muted">IVA</span>
            <span className="text-ink">{currencySymbol} {sale.taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-body-sm font-bold">
            <span className="text-ink">Total</span>
            <span className="text-ink">{currencySymbol} {sale.total.toFixed(2)}</span>
          </div>
          {isDualCurrency && sale.usdRate && sale.usdRate > 0 && (
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
                  <span className="text-ink">{currencySymbol} {p.amountBs.toFixed(2)}</span>
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

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            disabled={printStatus === 'printing'}
            className={`flex-1 rounded-lg py-3 text-body-sm font-medium transition-colors ${
              printStatus === 'success'
                ? 'bg-success/10 text-success'
                : printStatus === 'error'
                ? 'bg-error/10 text-error'
                : 'border border-hairline text-muted hover:text-ink hover:bg-surface'
            } disabled:opacity-50`}
          >
            {printStatus === 'printing' ? 'Imprimiendo...' :
             printStatus === 'success' ? 'Impreso ✓' :
             printStatus === 'error' ? 'Error al imprimir' :
             'Imprimir'}
          </button>
          <button
            onClick={onNewSale}
            className="flex-1 rounded-lg bg-primary py-3 text-body-sm font-medium text-on-primary
              transition-opacity hover:opacity-90"
          >
            Nueva venta
          </button>
        </div>
      </div>
    </div>
  )
}
