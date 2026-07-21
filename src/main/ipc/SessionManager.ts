export interface SessionData {
  userId: string
  username: string
  fullName: string
  role: string
  roleId: string
  sessionToken: string
  loggedAt: string
}

class SessionManager {
  private sessions = new Map<number, SessionData>()

  setSession(webContentsId: number, data: SessionData): void {
    this.sessions.set(webContentsId, data)
  }

  getSession(webContentsId: number): SessionData | null {
    return this.sessions.get(webContentsId) ?? null
  }

  removeSession(webContentsId: number): void {
    this.sessions.delete(webContentsId)
  }

  hasSession(webContentsId: number): boolean {
    return this.sessions.has(webContentsId)
  }
}

export const sessionManager = new SessionManager()
