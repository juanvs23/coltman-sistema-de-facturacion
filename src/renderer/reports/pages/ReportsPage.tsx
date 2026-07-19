import { useState, useEffect, useCallback } from 'react'

interface DailyData { date: string; sales: number; total: number; byMethod: Record<string, number> }
interface ProductRow { name: string; quantity: number; total: number }
interface UserRow { name: string; sales: number; total: number }
interface IvaRow { date: string; receiptNumber: number; customerName: string; customerTaxId: string; subtotal: number; taxTotal: number; total: number; discount: number }
interface IvaData { period: string; entries: IvaRow[]; totals: { subtotal: number; taxTotal: number; total: number; discount: number } }

type Tab = 'daily' | 'products' | 'users' | 'iva'

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo', TRANSFER: 'Transferencia', DEBIT_CARD: 'Débito',
  CREDIT_CARD: 'Crédito', DIVISA: 'Divisa', MIXED: 'Mixto'
}

export default function ReportsPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('daily')
  const [daily, setDaily] = useState<DailyData | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [iva, setIva] = useState<IvaData | null>(null)
  const [ivaMonth, setIvaMonth] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadDaily = useCallback(async () => {
    setLoading(true); setError('')
    const res = await window.electronAPI.getDailyReport()
    if (res.success && res.data) setDaily(res.data as DailyData)
    else setError(res.error ?? 'Error')
    setLoading(false)
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true); setError('')
    const res = await window.electronAPI.getProductReport()
    if (res.success && res.data) setProducts(res.data as ProductRow[])
    else setError(res.error ?? 'Error')
    setLoading(false)
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true); setError('')
    const res = await window.electronAPI.getUserReport()
    if (res.success && res.data) setUsers(res.data as UserRow[])
    else setError(res.error ?? 'Error')
    setLoading(false)
  }, [])

  const loadIva = useCallback(async (month: string) => {
    setLoading(true); setError(''); setIvaMonth(month)
    const res = await window.electronAPI.getIvaReport(month)
    if (res.success && res.data) setIva(res.data as IvaData)
    else setError(res.error ?? 'Error')
    setLoading(false)
  }, [])

  useEffect(() => {
    if (tab === 'daily') loadDaily()
    else if (tab === 'products') loadProducts()
    else if (tab === 'users') loadUsers()
    else loadIva(ivaMonth)
  }, [tab, loadDaily, loadProducts, loadUsers, loadIva, ivaMonth])

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-surface-soft/50">
      <div className="border-b border-hairline bg-canvas px-6 py-4 flex items-center justify-between">
        <h2 className="text-title-md text-ink">Reportes</h2>
        <nav className="flex gap-1">
          {(['daily', 'products', 'users', 'iva'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-caption font-medium transition-colors ${
                tab === t ? 'bg-primary text-on-primary' : 'text-muted hover:bg-surface-soft hover:text-ink'
              }`}>
              {t === 'daily' ? 'Ventas del día' : t === 'products' ? 'Por producto' : t === 'users' ? 'Por usuario' : 'Libro IVA'}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {error && <div className="mb-4 rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>}
        {loading && <p className="text-body-sm text-muted-soft py-8 text-center">Cargando...</p>}

        {/* Daily sales */}
        {!loading && tab === 'daily' && daily && (
          <div className="max-w-2xl space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-hairline bg-surface-card p-4">
                <p className="text-caption text-muted">Ventas</p>
                <p className="text-title-sm text-ink">{daily.sales}</p>
              </div>
              <div className="rounded-lg border border-hairline bg-surface-card p-4">
                <p className="text-caption text-muted">Total</p>
                <p className="text-title-sm text-ink">Bs. {daily.total.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-hairline bg-surface-card p-4">
                <p className="text-caption text-muted">Ticket promedio</p>
                <p className="text-title-sm text-ink">Bs. {daily.sales > 0 ? (daily.total / daily.sales).toFixed(2) : '0.00'}</p>
              </div>
            </div>
            <div className="rounded-lg border border-hairline bg-surface-card p-4">
              <p className="text-body-sm font-medium text-ink mb-2">Por método de pago</p>
              {Object.entries(daily.byMethod).filter(([k]) => k !== 'count').map(([method, total]) => (
                <div key={method} className="flex justify-between text-body-sm py-1">
                  <span className="text-muted">{METHOD_LABELS[method] ?? method}</span>
                  <span className="text-ink">Bs. {total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* By product */}
        {!loading && tab === 'products' && (
          <div className="max-w-2xl rounded-lg border border-hairline bg-surface-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft text-left">
                  <th className="px-4 py-2 text-caption font-medium text-muted">Producto</th>
                  <th className="px-4 py-2 text-caption font-medium text-muted text-right">Cantidad</th>
                  <th className="px-4 py-2 text-caption font-medium text-muted text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.name} className="border-b border-hairline">
                    <td className="px-4 py-2 text-body-sm text-ink">{p.name}</td>
                    <td className="px-4 py-2 text-body-sm text-ink text-right">{p.quantity}</td>
                    <td className="px-4 py-2 text-body-sm text-ink text-right">Bs. {p.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* By user */}
        {!loading && tab === 'users' && (
          <div className="max-w-2xl rounded-lg border border-hairline bg-surface-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft text-left">
                  <th className="px-4 py-2 text-caption font-medium text-muted">Usuario</th>
                  <th className="px-4 py-2 text-caption font-medium text-muted text-right">Ventas</th>
                  <th className="px-4 py-2 text-caption font-medium text-muted text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.name} className="border-b border-hairline">
                    <td className="px-4 py-2 text-body-sm text-ink">{u.name}</td>
                    <td className="px-4 py-2 text-body-sm text-ink text-right">{u.sales}</td>
                    <td className="px-4 py-2 text-body-sm text-ink text-right">Bs. {u.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* IVA Book */}
        {!loading && tab === 'iva' && (
          <div className="max-w-4xl space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-caption text-muted">Período</label>
              <input type="month" value={ivaMonth} onChange={e => loadIva(e.target.value)}
                className="rounded border border-hairline bg-canvas px-2 py-1 text-caption text-ink focus:border-primary focus:outline-none" />
            </div>
            {iva && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <div className="rounded-lg border border-hairline bg-surface-card p-3">
                    <p className="text-caption text-muted">Subtotal</p>
                    <p className="text-body-sm font-medium text-ink">Bs. {iva.totals.subtotal.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg border border-hairline bg-surface-card p-3">
                    <p className="text-caption text-muted">IVA</p>
                    <p className="text-body-sm font-medium text-ink">Bs. {iva.totals.taxTotal.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg border border-hairline bg-surface-card p-3">
                    <p className="text-caption text-muted">Total</p>
                    <p className="text-body-sm font-medium text-ink">Bs. {iva.totals.total.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg border border-hairline bg-surface-card p-3">
                    <p className="text-caption text-muted">{iva.entries.length} facturas</p>
                    <p className="text-body-sm font-medium text-ink">Bs. {iva.totals.discount.toFixed(2)} desc.</p>
                  </div>
                </div>
                <div className="rounded-lg border border-hairline bg-surface-card overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-hairline bg-surface-soft">
                        <th className="px-3 py-2 text-caption text-muted">N°</th>
                        <th className="px-3 py-2 text-caption text-muted">Cliente</th>
                        <th className="px-3 py-2 text-caption text-muted">RIF</th>
                        <th className="px-3 py-2 text-caption text-muted text-right">Base imp.</th>
                        <th className="px-3 py-2 text-caption text-muted text-right">IVA</th>
                        <th className="px-3 py-2 text-caption text-muted text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {iva.entries.map((e, i) => (
                        <tr key={i} className="border-b border-hairline/50 text-body-sm">
                          <td className="px-3 py-1.5 font-mono text-ink">{String(e.receiptNumber).padStart(4,'0')}</td>
                          <td className="px-3 py-1.5 text-ink">{e.customerName}</td>
                          <td className="px-3 py-1.5 text-muted font-mono text-caption">{e.customerTaxId}</td>
                          <td className="px-3 py-1.5 text-ink text-right">Bs. {e.subtotal.toFixed(2)}</td>
                          <td className="px-3 py-1.5 text-ink text-right">Bs. {e.taxTotal.toFixed(2)}</td>
                          <td className="px-3 py-1.5 text-ink text-right font-medium">Bs. {e.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
