import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import type { User } from '@shared/types'
import type { IUserRepository, CreateUserInput, UpdateUserInput } from '../../core/ports/IUserRepository'

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async list(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        active: true
      }
    })
    return users as User[]
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        active: true
      }
    })
    return user as User | null
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        active: true
      }
    })
    return user as User | null
  }

  async create(input: CreateUserInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(input.password, 12)
    const user = await this.prisma.user.create({
      data: {
        username: input.username,
        password: hashedPassword,
        fullName: input.fullName,
        role: input.role
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        active: true
      }
    })
    return user as User
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const data: Record<string, string> = {}
    if (input.fullName !== undefined) data.fullName = input.fullName
    if (input.role !== undefined) data.role = input.role
    if (input.password !== undefined) {
      data.password = await bcrypt.hash(input.password, 12)
    }
    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        active: true
      }
    })
    return user as User
  }

  async toggleActive(id: string): Promise<User> {
    const current = await this.prisma.user.findUnique({ where: { id }, select: { active: true } })
    if (!current) throw new Error('Usuario no encontrado')
    const user = await this.prisma.user.update({
      where: { id },
      data: { active: !current.active },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        active: true
      }
    })
    return user as User
  }
}
