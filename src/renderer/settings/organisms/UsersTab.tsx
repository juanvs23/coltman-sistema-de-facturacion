import { useState, useEffect, useCallback } from 'react'
import type { User } from '@shared/types'
import UserFormModal from './UserFormModal'
import type { UserFormData } from './UserFormModal'

interface RoleOption {
  id: string
  name: string
}

const ROLE_DISPLAY: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Administrador',
  seller: 'Vendedor'
}

function displayRole(name: string): string {
  return ROLE_DISPLAY[name] ?? name
}

export default function UsersTab(): JSX.Element {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [usersRes, rolesRes] = await Promise.all([
        window.electronAPI.listUsers(),
        window.electronAPI.listRoles()
      ])
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data)
      } else {
        setError(usersRes.error ?? 'Error al cargar usuarios')
      }
      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data.map(r => ({ id: r.id, name: r.name })))
      }
    } catch {
      setError('Error de conexion con el servidor')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleCreate = async (data: UserFormData): Promise<void> => {
    const res = await window.electronAPI.createUser({
      username: data.username,
      fullName: data.fullName,
      password: data.password,
      roleId: data.roleId
    })
    if (res.success) {
      setShowCreate(false)
      await loadUsers()
    } else {
      throw new Error(res.error)
    }
  }

  const handleUpdate = async (data: UserFormData): Promise<void> => {
    if (!editingUser) return
    const res = await window.electronAPI.updateUser(editingUser.id, {
      fullName: data.fullName,
      roleId: data.roleId,
      password: data.password || undefined
    })
    if (res.success) {
      setEditingUser(null)
      await loadUsers()
    } else {
      throw new Error(res.error)
    }
  }

  const handleToggleActive = async (user: User): Promise<void> => {
    const res = await window.electronAPI.toggleUserActive(user.id)
    if (res.success) {
      await loadUsers()
    } else {
      setError(res.error ?? 'Error al cambiar estado')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-muted">
          {users.length} usuario{users.length !== 1 ? 's' : ''} registrados
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary transition-opacity hover:opacity-90"
        >
          + Crear usuario
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
          {error}
          <button onClick={loadUsers} className="ml-2 underline">Reintentar</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-body-sm text-muted-soft">Cargando usuarios...</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && users.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-body-sm text-muted-soft">No hay usuarios registrados</p>
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-hairline">
          <table className="w-full text-left text-body-sm">
            <thead>
              <tr className="border-b border-hairline bg-surface-soft">
                <th className="px-4 py-3 font-medium text-muted">Usuario</th>
                <th className="px-4 py-3 font-medium text-muted">Nombre completo</th>
                <th className="px-4 py-3 font-medium text-muted">Rol</th>
                <th className="px-4 py-3 font-medium text-muted">Estado</th>
                <th className="px-4 py-3 font-medium text-muted">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-hairline last:border-0">
                  <td className="px-4 py-3 text-ink">{user.username}</td>
                  <td className="px-4 py-3 text-ink">{user.fullName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-caption
                      ${user.role === 'superadmin'
                        ? 'bg-warning/10 text-warning'
                        : user.role === 'admin'
                          ? 'bg-info/10 text-info'
                          : 'bg-surface-soft text-muted'
                      }`}>
                      {displayRole(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-caption
                      ${user.active ? 'text-success' : 'text-muted-soft'}`}>
                      <span className={`h-2 w-2 rounded-full ${user.active ? 'bg-success' : 'bg-muted-soft'}`} />
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="rounded px-2 py-1 text-caption text-muted transition-colors hover:bg-surface-soft hover:text-ink"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`rounded px-2 py-1 text-caption transition-colors
                          ${user.active
                            ? 'text-error hover:bg-error/10'
                            : 'text-success hover:bg-success/10'
                          }`}
                      >
                        {user.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <UserFormModal
          user={null}
          roles={roles}
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}

      {editingUser && (
        <UserFormModal
          user={editingUser}
          roles={roles}
          onClose={() => setEditingUser(null)}
          onSave={handleUpdate}
        />
      )}
    </div>
  )
}
