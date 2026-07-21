import type { User } from '@shared/types'

export type CreateUserInput = {
  username: string
  password: string
  fullName: string
  roleId: string
}

export type UpdateUserInput = {
  fullName?: string
  roleId?: string
  password?: string
}

export interface IUserRepository {
  list(): Promise<User[]>
  findById(id: string): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
  create(input: CreateUserInput): Promise<User>
  update(id: string, input: UpdateUserInput): Promise<User>
  toggleActive(id: string): Promise<User>
}
