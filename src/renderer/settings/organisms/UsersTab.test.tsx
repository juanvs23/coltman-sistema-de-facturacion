import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UsersTab from './UsersTab'
import type { User } from '@shared/types'

const MOCK_USERS: User[] = [
  { id: '1', username: 'admin', fullName: 'Admin Principal', role: 'SUPERADMIN', active: true },
  { id: '2', username: 'vendedor1', fullName: 'Vendedor Uno', role: 'SELLER', active: true },
  { id: '3', username: 'vendedor2', fullName: 'Vendedor Dos', role: 'SELLER', active: false }
]

beforeEach(() => {
  window.electronAPI.listUsers = vi.fn().mockResolvedValue({ success: true, data: MOCK_USERS })
  window.electronAPI.createUser = vi.fn().mockResolvedValue({ success: true, data: MOCK_USERS[0] })
  window.electronAPI.updateUser = vi.fn().mockResolvedValue({ success: true, data: MOCK_USERS[0] })
  window.electronAPI.toggleUserActive = vi.fn().mockResolvedValue({ success: true, data: { ...MOCK_USERS[1], active: false } })
})

describe('UsersTab', () => {
  it('loads and displays users', async () => {
    render(<UsersTab />)

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    expect(screen.getByText('Admin Principal')).toBeInTheDocument()
    expect(screen.getByText('Vendedor Uno')).toBeInTheDocument()
    expect(screen.getByText('Vendedor Dos')).toBeInTheDocument()
    expect(screen.getByText('3 usuarios registrados')).toBeInTheDocument()
  })

  it('shows correct role badges', async () => {
    render(<UsersTab />)

    await waitFor(() => {
      expect(screen.getByText('Superadmin')).toBeInTheDocument()
    })

    expect(screen.getAllByText('Vendedor')).toHaveLength(2)
  })

  it('shows active/inactive status', async () => {
    render(<UsersTab />)

    await waitFor(() => {
      const statuses = screen.getAllByText(/Activo|Inactivo/)
      expect(statuses).toHaveLength(3)
    })
  })

  it('opens create modal when clicking Crear usuario', async () => {
    const user = userEvent.setup()
    render(<UsersTab />)

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    await user.click(screen.getByText('+ Crear usuario'))

    // Modal title and submit button both say "Crear usuario" — check specific elements
    expect(screen.getByRole('heading', { name: 'Crear usuario' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Nombre de usuario' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Nombre completo' })).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Rol' })).toBeInTheDocument()
  })

  it('creates a new user via form', async () => {
    const user = userEvent.setup()
    render(<UsersTab />)

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    await user.click(screen.getByText('+ Crear usuario'))
    await user.type(screen.getByRole('textbox', { name: 'Nombre de usuario' }), 'nuevo')
    await user.type(screen.getByRole('textbox', { name: 'Nombre completo' }), 'Nuevo Usuario')
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }))

    await waitFor(() => {
      expect(window.electronAPI.createUser).toHaveBeenCalledWith({
        username: 'nuevo',
        fullName: 'Nuevo Usuario',
        password: 'password123',
        role: 'SELLER'
      })
    })
  })

  it('shows error when create fails', async () => {
    window.electronAPI.createUser = vi.fn().mockResolvedValue({
      success: false,
      error: 'El nombre de usuario ya existe'
    })

    const user = userEvent.setup()
    render(<UsersTab />)

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    await user.click(screen.getByText('+ Crear usuario'))
    await user.type(screen.getByRole('textbox', { name: 'Nombre de usuario' }), 'admin')
    await user.type(screen.getByRole('textbox', { name: 'Nombre completo' }), 'Admin Dup')
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }))

    await waitFor(() => {
      expect(screen.getByText('El nombre de usuario ya existe')).toBeInTheDocument()
    })
  })

  it('validates required fields on create', async () => {
    const user = userEvent.setup()
    render(<UsersTab />)

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    await user.click(screen.getByText('+ Crear usuario'))
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }))

    await waitFor(() => {
      expect(screen.getByText('El nombre completo es obligatorio')).toBeInTheDocument()
    })
  })

  it('toggles user active state', async () => {
    const user = userEvent.setup()
    render(<UsersTab />)

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    const desactivateButtons = screen.getAllByText('Desactivar')
    await user.click(desactivateButtons[1])

    await waitFor(() => {
      expect(window.electronAPI.toggleUserActive).toHaveBeenCalledWith('2')
    })
  })
})
