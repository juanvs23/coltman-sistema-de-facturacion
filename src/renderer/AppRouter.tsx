import { useAuth } from './shared/hooks/useAuth'
import AuthPage from './auth/pages/AuthPage'
import PosPage from './pos/pages/PosPage'
import { useEffect } from 'react'

export default function AppRouter(): JSX.Element {
  const { session, isLoading } = useAuth()

  useEffect(() => {
    // Track mouse usage for focus outlines
    const handleMouse = () => document.body.classList.add('using-mouse')
    const handleKey = () => document.body.classList.remove('using-mouse')
    document.addEventListener('mousedown', handleMouse)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleMouse)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-body-sm text-muted">Iniciando sistema...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <AuthPage />
  }

  return <PosPage />
}
