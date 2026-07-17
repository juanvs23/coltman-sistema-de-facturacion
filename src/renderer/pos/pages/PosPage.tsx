import { useAuth } from '../../shared/hooks/useAuth'
import { useTheme } from '../../shared/hooks/useTheme'

export default function PosPage(): JSX.Element {
  const { session, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-screen flex-col bg-canvas">
      {/* Top Navigation */}
      <header className="flex h-16 items-center justify-between border-b border-hairline px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-body-sm font-semibold text-on-primary">SF</span>
          </div>
          <h1 className="text-title-md text-ink">Sistema de Facturación</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full
              border border-hairline bg-canvas text-muted transition-colors hover:text-ink"
            aria-label="Alternar modo oscuro"
          >
            {theme === 'dark' ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* User Info */}
          <div className="flex items-center gap-2 border-l border-hairline pl-3">
            <div className="text-right">
              <p className="text-body-sm font-medium text-ink">{session?.fullName}</p>
              <p className="text-caption text-muted capitalize">{session?.role.toLowerCase()}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-md border border-hairline px-3 py-1.5 text-body-sm text-muted
                transition-colors hover:border-error hover:text-error"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar placeholder */}
        <nav className="w-56 shrink-0 border-r border-hairline bg-surface-soft p-3">
          <div className="flex flex-col gap-1">
            {[
              { label: 'Punto de Venta', icon: '💰', id: 'pos' },
              { label: 'Inventario', icon: '📦', id: 'inventory' },
              { label: 'Facturación', icon: '🧾', id: 'invoices' },
              { label: 'Caja', icon: '💵', id: 'cash' },
              { label: 'Reportes', icon: '📊', id: 'reports' },
              { label: 'Admin', icon: '⚙️', id: 'admin' }
            ].map((item) => (
              <button
                key={item.id}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-body-sm text-muted
                  transition-colors hover:bg-surface-card hover:text-ink"
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content Area */}
        <section className="flex flex-1 items-center justify-center bg-surface-soft/50 p-6">
          <div className="text-center">
            <p className="text-title-md text-muted-soft">Punto de Venta</p>
            <p className="mt-1 text-body-sm text-muted-soft">
              Seleccione una opción del menú lateral
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
