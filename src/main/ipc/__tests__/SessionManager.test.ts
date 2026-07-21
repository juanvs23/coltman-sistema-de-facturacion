import { describe, it, expect, beforeEach } from 'vitest'
import { sessionManager, SessionData } from '../SessionManager'

function makeSession(overrides?: Partial<SessionData>): SessionData {
  return {
    userId: 'user-1',
    username: 'test',
    fullName: 'Test User',
    role: 'ADMIN',
    sessionToken: 'token-abc',
    loggedAt: new Date().toISOString(),
    ...overrides
  }
}

describe('SessionManager', () => {
  beforeEach(() => {
    sessionManager.removeSession(1)
    sessionManager.removeSession(2)
  })

  describe('setSession', () => {
    it('stores session data for a webContents id', () => {
      const data = makeSession()
      sessionManager.setSession(1, data)
      expect(sessionManager.hasSession(1)).toBe(true)
    })

    it('overwrites existing session for the same webContents id', () => {
      sessionManager.setSession(1, makeSession({ userId: 'user-1' }))
      sessionManager.setSession(1, makeSession({ userId: 'user-2' }))
      expect(sessionManager.getSession(1)?.userId).toBe('user-2')
    })
  })

  describe('getSession', () => {
    it('returns session data if set', () => {
      const data = makeSession()
      sessionManager.setSession(1, data)
      expect(sessionManager.getSession(1)).toEqual(data)
    })

    it('returns null if no session for that id', () => {
      expect(sessionManager.getSession(99)).toBeNull()
    })
  })

  describe('removeSession', () => {
    it('removes session for a webContents id', () => {
      sessionManager.setSession(1, makeSession())
      sessionManager.removeSession(1)
      expect(sessionManager.hasSession(1)).toBe(false)
    })

    it('does not throw when removing a non-existent session', () => {
      expect(() => sessionManager.removeSession(99)).not.toThrow()
    })
  })

  describe('hasSession', () => {
    it('returns true for active sessions', () => {
      sessionManager.setSession(1, makeSession())
      expect(sessionManager.hasSession(1)).toBe(true)
    })

    it('returns false for no session', () => {
      expect(sessionManager.hasSession(1)).toBe(false)
    })
  })

  it('sessions are isolated between different webContents ids', () => {
    const data1 = makeSession({ userId: 'user-1' })
    const data2 = makeSession({ userId: 'user-2' })
    sessionManager.setSession(1, data1)
    sessionManager.setSession(2, data2)

    expect(sessionManager.getSession(1)?.userId).toBe('user-1')
    expect(sessionManager.getSession(2)?.userId).toBe('user-2')
  })
})
