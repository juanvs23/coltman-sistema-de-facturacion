import { prisma } from './prisma'
import type { Customer } from '@shared/types'
import type { ICustomerRepository, CreateCustomerInput, UpdateCustomerInput } from '../../core/ports/ICustomerRepository'

export class PrismaCustomerRepository implements ICustomerRepository {
  async list(): Promise<Customer[]> {
    return prisma.customer.findMany({
      orderBy: { name: 'asc' }
    }) as unknown as Customer[]
  }

  async findById(id: string): Promise<Customer | null> {
    return prisma.customer.findUnique({ where: { id } }) as unknown as Customer | null
  }

  async findByTaxId(taxId: string): Promise<Customer | null> {
    return prisma.customer.findUnique({ where: { taxId } }) as unknown as Customer | null
  }

  async search(query: string): Promise<Customer[]> {
    return prisma.customer.findMany({
      where: {
        OR: [
          { taxId: { contains: query } },
          { name: { contains: query } }
        ]
      },
      orderBy: { name: 'asc' },
      take: 20
    }) as unknown as Customer[]
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    return prisma.customer.create({ data: input }) as unknown as Customer
  }

  async update(id: string, input: UpdateCustomerInput): Promise<Customer> {
    return prisma.customer.update({ where: { id }, data: input }) as unknown as Customer
  }

  async delete(id: string): Promise<void> {
    await prisma.customer.update({
      where: { id },
      data: { active: false }
    })
  }
}
