import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AuthSession, LoginRequest } from '@shared/types'

interface AuthContextType {
  session: AuthSession | null
  isLoading: boolean
  error: string | null
  login: (credentials: LoginRequest) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI.login(credentials)
      if (result.success && result.data) {
        setSession(result.data)
        return true
      }
      setError(result.error ?? 'Error al iniciar sesión')
      return false
    } catch (err) {
      setError('Error de conexión con el sistema')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    if (session) {
      await window.electronAPI.logout()
    }
    setSession(null)
  }, [session])

  return (
    <AuthContext.Provider value={{ session, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
