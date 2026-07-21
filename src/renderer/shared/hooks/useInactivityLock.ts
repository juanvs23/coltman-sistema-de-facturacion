import { useState, useEffect, useCallback, useRef } from 'react'

const DEFAULT_TIMEOUT_SECONDS = 600
const EVENTS = ['mousedown', 'keydown', 'mousemove', 'touchstart', 'scroll'] as const

interface UseInactivityLockReturn {
  isLocked: boolean
  lockError: string | null
  unlock: (password: string) => Promise<boolean>
  resetTimer: () => void
}

export function useInactivityLock(timeoutSeconds?: number): UseInactivityLockReturn {
  const [isLocked, setIsLocked] = useState(false)
  const [lockError, setLockError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seconds = timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    if (!isLocked) {
      timerRef.current = setTimeout(() => {
        setIsLocked(true)
        setLockError(null)
      }, seconds * 1000)
    }
  }, [seconds, isLocked])

  useEffect(() => {
    if (isLocked) return

    const handler = () => resetTimer()

    EVENTS.forEach((event) => document.addEventListener(event, handler, { passive: true }))

    resetTimer()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      EVENTS.forEach((event) => document.removeEventListener(event, handler))
    }
  }, [isLocked, resetTimer])

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    setLockError(null)
    try {
      const result = await window.electronAPI.unlock(password)
      if (result.success) {
        setIsLocked(false)
        return true
      }
      setLockError(result.error ?? 'Contraseña incorrecta')
      return false
    } catch {
      setLockError('Error de conexión al desbloquear')
      return false
    }
  }, [])

  return { isLocked, lockError, unlock, resetTimer }
}
