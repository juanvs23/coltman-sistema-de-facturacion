import type { ViewId } from '../../shared/hooks/useNavigation'
import InventoryPage from '../../inventory/pages/InventoryPage'
import InvoicesPage from '../../invoices/pages/InvoicesPage'
import CashRegisterPage from '../../cash-register/pages/CashRegisterPage'
import ReportsPage from '../../reports/pages/ReportsPage'
import SettingsPage from '../../settings/pages/SettingsPage'

interface ContentAreaProps {
  activeView: ViewId
}

export default function ContentArea({ activeView }: ContentAreaProps): JSX.Element {
  switch (activeView) {
    case 'inventory':
      return <InventoryPage />
    case 'invoices':
      return <InvoicesPage />
    case 'cash':
      return <CashRegisterPage />
    case 'reports':
      return <ReportsPage />
    case 'settings':
      return <SettingsPage />
    default:
      return (
        <section className="flex flex-1 items-center justify-center bg-surface-soft/50 p-6">
          <div className="text-center">
            <p className="text-title-md text-muted-soft">Punto de Venta</p>
            <p className="mt-1 text-body-sm text-muted-soft">
              Seleccione una opción del menú lateral
            </p>
          </div>
        </section>
      )
  }
}
