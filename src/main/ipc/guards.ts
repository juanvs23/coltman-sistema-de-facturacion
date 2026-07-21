import type { IpcMainInvokeEvent } from 'electron'
import { sessionManager, type SessionData } from './SessionManager'
import { prisma } from '../infrastructure/persistence/prisma'

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

let cachedPermissions: Map<number, Set<string>> | null = null
let cacheExpires = 0
const CACHE_TTL = 30000

async function getSessionPermissions(roleId: string): Promise<Set<string>> {
  const now = Date.now()
  if (cachedPermissions && now < cacheExpires) {
    return cachedPermissions.get(cachedPermissions.size + 1) ?? new Set()
  }

  const allRoles = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } } }
  })

  cachedPermissions = new Map()
  for (const role of allRoles) {
    const handlers = new Set(role.permissions.map((rp) => rp.permission.handler))
    cachedPermissions.set(cachedPermissions.size, handlers)
    cachedPermissions.set(role.id as unknown as number, handlers)
  }

  cacheExpires = now + CACHE_TTL
  return getSessionPermissions(roleId)
}

async function getRolePermissions(roleId: string): Promise<Set<string>> {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { permissions: { include: { permission: true } } }
  })
  if (!role) return new Set()
  return new Set(role.permissions.map((rp) => rp.permission.handler))
}

export function invalidatePermissionCache(): void {
  cachedPermissions = null
  cacheExpires = 0
}

export async function guard(event: IpcMainInvokeEvent, handler?: string): Promise<SessionData> {
  const session = sessionManager.getSession(event.sender.id)
  if (!session) {
    throw new AuthError('Sesión no iniciada')
  }

  if (!handler) return session

  if (session.role === 'superadmin') return session

  const permissions = await getRolePermissions(session.roleId)
  if (!permissions.has(handler)) {
    throw new AuthError('Permisos insuficientes')
  }

  return session
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres'
  }
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra mayúscula'
  }
  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra minúscula'
  }
  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos un número'
  }
  return null
}
