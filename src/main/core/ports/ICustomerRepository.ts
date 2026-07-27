import type { Customer } from '@shared/types'

export type CreateCustomerInput = {
  taxId: string
  name: string
  personType?: string
  personSubtype?: string
  legalType?: string
  address?: string
  phone?: string
  email?: string
}

export type UpdateCustomerInput = {
  name?: string
  personType?: string
  personSubtype?: string
  legalType?: string
  address?: string
  phone?: string
  email?: string
  active?: boolean
}

export interface ICustomerRepository {
  list(): Promise<Customer[]>
  findById(id: string): Promise<Customer | null>
  findByTaxId(taxId: string): Promise<Customer | null>
  search(query: string): Promise<Customer[]>
  create(input: CreateCustomerInput): Promise<Customer>
  update(id: string, input: UpdateCustomerInput): Promise<Customer>
  delete(id: string): Promise<void>
}
