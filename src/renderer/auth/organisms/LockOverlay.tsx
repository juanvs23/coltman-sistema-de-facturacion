import { useState } from 'react'
import { useAuth } from '../../shared/hooks/useAuth'

interface LockOverlayProps {
  lockError: string | null
  onUnlock: (password: string) => Promise<boolean>
}

export default function LockOverlay({ lockError, onUnlock }: LockOverlayProps): JSX.Element {
  const { session, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return
    setSubmitting(true)
    await onUnlock(password)
    setPassword('')
    setSubmitting(false)
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleOverlayClick = () => {
    setPassword('')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-surface-card p-8 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft">
            <svg className="h-7 w-7 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-title-sm text-ink">Sesion bloqueada</h2>
          {session && (
            <p className="mt-1 text-body-sm text-muted">
              {session.fullName}
            </p>
          )}
          <p className="mt-2 text-body-sm text-muted">
            Ingresa tu clave para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contrasena"
              autoFocus
              disabled={submitting}
              className="w-full rounded-md border border-hairline bg-canvas px-4 py-2.5 text-body-md text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none"
            />
          </div>

          {lockError && (
            <p className="text-center text-body-sm text-error">{lockError}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !password.trim()}
            className="w-full rounded-md bg-primary px-5 py-2.5 text-button text-on-primary transition-colors hover:bg-primary-active disabled:opacity-50"
          >
            {submitting ? 'Verificando...' : 'Desbloquear'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleLogout}
            className="text-body-sm text-muted hover:text-ink transition-colors"
          >
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  )
}
