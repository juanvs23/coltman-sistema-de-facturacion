import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useInactivityLock } from '../useInactivityLock'

describe('useInactivityLock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.electronAPI = {
      ...window.electronAPI,
      unlock: vi.fn().mockResolvedValue({ success: true, data: {} })
    } as unknown as Window['electronAPI']
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts unlocked', () => {
    const { result } = renderHook(() => useInactivityLock())
    expect(result.current.isLocked).toBe(false)
    expect(result.current.lockError).toBeNull()
  })

  it('locks after timeout of inactivity', () => {
    const { result } = renderHook(() => useInactivityLock(1))
    expect(result.current.isLocked).toBe(false)

    act(() => { vi.advanceTimersByTime(1100) })

    expect(result.current.isLocked).toBe(true)
  })

  it('resets timer on user activity', () => {
    const { result } = renderHook(() => useInactivityLock(1))
    act(() => { vi.advanceTimersByTime(500) })

    act(() => { document.dispatchEvent(new MouseEvent('mousemove')) })
    act(() => { vi.advanceTimersByTime(500) })

    expect(result.current.isLocked).toBe(false)
    act(() => { vi.advanceTimersByTime(600) })
    expect(result.current.isLocked).toBe(true)
  })

  it('unlock succeeds with correct password', async () => {
    vi.mocked(window.electronAPI.unlock).mockResolvedValue({ success: true, data: { userId: 'u1' } } as never)

    const { result } = renderHook(() => useInactivityLock(1))
    act(() => { vi.advanceTimersByTime(1100) })
    expect(result.current.isLocked).toBe(true)

    await act(async () => {
      const ok = await result.current.unlock('Abc12345')
      expect(ok).toBe(true)
    })
    expect(result.current.isLocked).toBe(false)
    expect(result.current.lockError).toBeNull()
  })

  it('unlock fails with wrong password and stays locked', async () => {
    vi.mocked(window.electronAPI.unlock).mockResolvedValue({ success: false, error: 'Contrasena incorrecta' } as never)

    const { result } = renderHook(() => useInactivityLock(1))
    act(() => { vi.advanceTimersByTime(1100) })
    expect(result.current.isLocked).toBe(true)

    await act(async () => {
      const ok = await result.current.unlock('wrong')
      expect(ok).toBe(false)
    })
    expect(result.current.isLocked).toBe(true)
    expect(result.current.lockError).toBe('Contrasena incorrecta')
  })

  it('does not start timer when locked', () => {
    const { result } = renderHook(() => useInactivityLock(1))
    act(() => { vi.advanceTimersByTime(1100) })
    expect(result.current.isLocked).toBe(true)

    act(() => { document.dispatchEvent(new MouseEvent('mousemove')) })
    act(() => { vi.advanceTimersByTime(1100) })

    expect(result.current.isLocked).toBe(true)
  })

  it('uses default timeout when none provided', () => {
    const { result } = renderHook(() => useInactivityLock())
    expect(result.current.isLocked).toBe(false)
    // Default is 600s, advancing 1 second should not lock
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.isLocked).toBe(false)
  })
})
