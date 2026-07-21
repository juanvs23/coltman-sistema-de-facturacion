import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import type { User } from '@shared/types'
import type { IUserRepository, CreateUserInput, UpdateUserInput } from '../../core/ports/IUserRepository'

const roleSelect = { select: { id: true, name: true } } as const

function mapUser(u: {
  id: string
  username: string
  fullName: string
  active: boolean
  role: { id: string; name: string }
}): User {
  return {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    role: u.role.name,
    roleId: u.role.id,
    active: u.active
  }
}

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async list(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      include: { role: roleSelect }
    })
    return users.map(mapUser)
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: roleSelect }
    })
    return user ? mapUser(user) : null
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { role: roleSelect }
    })
    return user ? mapUser(user) : null
  }

  async create(input: CreateUserInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(input.password, 12)
    const user = await this.prisma.user.create({
      data: {
        username: input.username,
        password: hashedPassword,
        fullName: input.fullName,
        roleId: input.roleId
      },
      include: { role: roleSelect }
    })
    return mapUser(user)
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const data: Record<string, string> = {}
    if (input.fullName !== undefined) data.fullName = input.fullName
    if (input.roleId !== undefined) data.roleId = input.roleId
    if (input.password !== undefined) {
      data.password = await bcrypt.hash(input.password, 12)
    }
    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: { role: roleSelect }
    })
    return mapUser(user)
  }

  async toggleActive(id: string): Promise<User> {
    const current = await this.prisma.user.findUnique({ where: { id }, select: { active: true } })
    if (!current) throw new Error('Usuario no encontrado')
    const user = await this.prisma.user.update({
      where: { id },
      data: { active: !current.active },
      include: { role: roleSelect }
    })
    return mapUser(user)
  }
}
