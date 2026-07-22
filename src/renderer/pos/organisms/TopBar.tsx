import type { DocumentType } from '@shared/types'
import { useAuth } from '../../shared/hooks/useAuth'
import { useTheme } from '../../shared/hooks/useTheme'
import { useCountry } from '../../shared/hooks/useCountry'

interface TopBarProps {
  documentType: DocumentType
  onDocumentTypeChange: (type: DocumentType) => void
  usdRate: number
  receiptNumber: number
}

export default function TopBar({ documentType, onDocumentTypeChange, usdRate, receiptNumber }: TopBarProps): JSX.Element {
  const { session, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { currencySymbol } = useCountry()

  const docLabel = documentType === 'FACTURA' ? 'Factura' : 'Ticket'
  const paddedNumber = String(receiptNumber).padStart(4, '0')

  return (
    <header className="flex h-16 items-center justify-between border-b border-hairline px-4">
      <div className="flex items-center gap-3">
        {/* Document type toggle */}
        <div className="flex rounded-md border border-hairline overflow-hidden">
          <button
            onClick={() => onDocumentTypeChange('FACTURA')}
            className={`px-3 py-1 text-caption font-medium transition-colors ${
              documentType === 'FACTURA'
                ? 'bg-primary text-on-primary'
                : 'text-muted hover:bg-surface-soft hover:text-ink'
            }`}
          >
            Factura
          </button>
          <button
            onClick={() => onDocumentTypeChange('TICKET')}
            className={`px-3 py-1 text-caption font-medium transition-colors ${
              documentType === 'TICKET'
                ? 'bg-primary text-on-primary'
                : 'text-muted hover:bg-surface-soft hover:text-ink'
            }`}
          >
            Ticket
          </button>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
          <span className="text-body-sm font-semibold text-on-primary">SF</span>
        </div>
        <h1 className="text-title-md text-ink">Sistema de Facturación</h1>

        {/* USD Rate + Receipt number */}
        <div className="flex items-center gap-3 border-l border-hairline pl-3 ml-1">
          <div className="rounded-md bg-surface-soft px-3 py-1">
            <span className="text-caption text-muted">Tasa: </span>
            <span className="text-caption font-mono font-medium text-ink">
              {currencySymbol} {usdRate.toFixed(2)}
            </span>
          </div>
          <div className="rounded-md bg-primary/10 px-3 py-1">
            <span className="text-caption font-mono font-medium text-primary">
              {docLabel} N° {paddedNumber}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
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
  )
}
