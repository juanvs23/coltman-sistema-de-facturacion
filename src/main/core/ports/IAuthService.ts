import type { AuthSession, LoginRequest } from '@shared/types'

export interface IAuthService {
  login(credentials: LoginRequest): Promise<AuthSession>
  logout(session: AuthSession): Promise<void>
  validateSession(session: AuthSession): Promise<boolean>
}
