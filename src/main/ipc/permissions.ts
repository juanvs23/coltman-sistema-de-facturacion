import type { Role } from '@prisma/client'

const ROLES = {
  SELLER: ['SELLER', 'ADMIN', 'SUPERADMIN'] as const,
  ADMIN: ['ADMIN', 'SUPERADMIN'] as const,
  SUPERADMIN: ['SUPERADMIN'] as const,
  ANY: ['SELLER', 'ADMIN', 'SUPERADMIN'] as const,
} as const

export const PERMISSIONS: Record<string, readonly string[]> = {
  'auth:login': [],
  'auth:logout': [],
  'auth:session': [],

  // Read operations — any authenticated user
  'products:list': ROLES.ANY,
  'products:search': ROLES.ANY,
  'categories:list': ROLES.ANY,
  'taxes:list': ROLES.ANY,
  'customers:list': ROLES.ANY,
  'customers:search': ROLES.ANY,
  'customers:find-by-tax-id': ROLES.ANY,
  'sales:list': ROLES.ANY,
  'sales:next-receipt-number': ROLES.ANY,
  'cash:summary': ROLES.ANY,
  'reports:daily': ROLES.ANY,
  'reports:by-product': ROLES.ANY,
  'reports:by-user': ROLES.ANY,
  'reports:iva': ROLES.ANY,
  'company:get': ROLES.ANY,
  'config:get': ROLES.ANY,
  'usd:rate': ROLES.ANY,

  // Write operations — ADMIN+
  'products:create': ROLES.ADMIN,
  'products:update': ROLES.ADMIN,
  'products:delete': ROLES.ADMIN,
  'categories:create': ROLES.ADMIN,
  'categories:update': ROLES.ADMIN,
  'categories:delete': ROLES.ADMIN,
  'taxes:create': ROLES.ADMIN,
  'taxes:update': ROLES.ADMIN,
  'customers:create': ROLES.ADMIN,
  'customers:update': ROLES.ADMIN,
  'customers:delete': ROLES.ADMIN,
  'cash:open': ROLES.ADMIN,
  'cash:close': ROLES.ADMIN,
  'cash:add-movement': ROLES.ADMIN,
  'config:update': ROLES.ADMIN,
  'company:update': ROLES.ADMIN,
  'printer:test': ROLES.ADMIN,
  'printer:print-receipt': ROLES.ADMIN,

  // Superadmin only
  'users:list': ROLES.SUPERADMIN,
  'users:create': ROLES.SUPERADMIN,
  'users:update': ROLES.SUPERADMIN,
  'users:toggle-active': ROLES.SUPERADMIN,
  'plugins:list': ROLES.SUPERADMIN,
  'plugins:install': ROLES.SUPERADMIN,
  'plugins:toggle-active': ROLES.SUPERADMIN,
  'ui-registry:subscribe': ROLES.ANY,
  'ui-registry:get-state': ROLES.ANY,

  // Sales and cash by any authenticated user
  'sales:create': ROLES.ANY,
  'sales:cancel': ROLES.ANY,
} as const
