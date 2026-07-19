import type { Sale } from '@shared/types'
import SaleRow from '../molecules/SaleRow'

interface SaleTableProps {
  sales: Sale[]
  onViewDetail: (sale: Sale) => void
  onCancel: (sale: Sale) => void
  currentUserId?: string
}

export default function SaleTable({ sales, onViewDetail, onCancel, currentUserId }: SaleTableProps): JSX.Element {
  const canCancel = (s: Sale): boolean =>
    s.status === 'COMPLETED' && s.userId === currentUserId

  return (
    <div className="overflow-x-auto rounded-lg border border-hairline bg-surface-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-hairline bg-surface-soft text-left">
            <th className="px-4 py-2 text-caption font-medium text-muted">N°</th>
            <th className="px-4 py-2 text-caption font-medium text-muted">Tipo</th>
            <th className="px-4 py-2 text-caption font-medium text-muted">Cliente</th>
            <th className="px-4 py-2 text-caption font-medium text-muted">Método</th>
            <th className="px-4 py-2 text-caption font-medium text-muted text-right">Total</th>
            <th className="px-4 py-2 text-caption font-medium text-muted">Usuario</th>
            <th className="px-4 py-2 text-caption font-medium text-muted">Fecha</th>
            <th className="px-4 py-2 text-caption font-medium text-muted">Estado</th>
            <th className="px-4 py-2 text-caption font-medium text-muted"></th>
          </tr>
        </thead>
        <tbody>
          {sales.map(s => (
            <SaleRow
              key={s.id}
              sale={s}
              onViewDetail={() => onViewDetail(s)}
              onCancel={canCancel(s) ? () => onCancel(s) : undefined}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
