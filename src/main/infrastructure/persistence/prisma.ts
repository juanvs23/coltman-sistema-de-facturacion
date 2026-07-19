import { PrismaClient } from '@prisma/client'

/**
 * Singleton de PrismaClient.
 * Toda la app usa esta misma instancia.
 */
export const prisma = new PrismaClient()
