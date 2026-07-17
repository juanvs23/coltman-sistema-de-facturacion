import type { ReactNode } from 'react'
import { useTheme } from '../../shared/hooks/useTheme'

interface LoginLayoutProps {
  children: ReactNode
}

export default function LoginLayout({ children }: LoginLayoutProps): JSX.Element {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-soft px-4">
      <button
        onClick={toggleTheme}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full
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
      {children}
    </div>
  )
}
