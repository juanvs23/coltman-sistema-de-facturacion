import { useState, useEffect, useCallback } from 'react'

interface ActiveRegister {
  id: string
  openingBalance: number
  openedAt: string
  shiftConfig?: { id: string; name: string; startTime: string; endTime: string } | null
  openedBy?: { fullName: string } | null
}

interface UseActiveCashRegisterReturn {
  register: ActiveRegister | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useActiveCashRegister(): UseActiveCashRegisterReturn {
  const [register, setRegister] = useState<ActiveRegister | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await window.electronAPI.getActiveCashRegister()
      if (res.success) {
        setRegister(res.data ?? null)
      } else {
        setError(res.error ?? 'Error al consultar caja activa')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
    const interval = setInterval(refetch, 15000) // refresh every 15s
    const onRegisterChange = () => refetch()
    window.addEventListener('register:changed', onRegisterChange)
    return () => {
      clearInterval(interval)
      window.removeEventListener('register:changed', onRegisterChange)
    }
  }, [refetch])

  return { register, loading, error, refetch }
}
