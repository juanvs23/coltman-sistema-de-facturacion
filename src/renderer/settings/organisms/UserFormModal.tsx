import { useState, useEffect } from 'react'
import type { User } from '@shared/types'

interface RoleOption {
  id: string
  name: string
}

interface UserFormModalProps {
  user: User | null
  roles: RoleOption[]
  onClose: () => void
  onSave: (data: UserFormData) => Promise<void>
}

export interface UserFormData {
  username: string
  fullName: string
  password: string
  roleId: string
}

const ROLE_DISPLAY: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Administrador',
  seller: 'Vendedor'
}

function displayRole(name: string): string {
  return ROLE_DISPLAY[name] ?? name
}

export default function UserFormModal({ user, roles, onClose, onSave }: UserFormModalProps): JSX.Element {
  const isEditing = user !== null
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setUsername(user.username)
      setFullName(user.fullName)
      setRoleId(user.roleId ?? '')
    } else if (roles.length > 0) {
      setRoleId(roles[0].id)
    }
  }, [user, roles])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('El nombre completo es obligatorio')
      return
    }
    if (!isEditing && !username.trim()) {
      setError('El nombre de usuario es obligatorio')
      return
    }
    if (!isEditing && !password.trim()) {
      setError('La contraseña es obligatoria')
      return
    }
    if (!isEditing && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (!roleId) {
      setError('Debe seleccionar un rol')
      return
    }

    setSaving(true)
    try {
      await onSave({ username: username.trim(), fullName: fullName.trim(), password, roleId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-surface-card p-6 shadow-lg">
        <h3 className="text-title-sm text-ink">
          {isEditing ? 'Editar usuario' : 'Crear usuario'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {error && (
            <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
              {error}
            </div>
          )}

          {!isEditing && (
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted" htmlFor="username">
                Nombre de usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink
                  placeholder:text-muted-soft focus:border-primary focus:outline-none"
                placeholder="ej: vendedor3"
                disabled={isEditing}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-caption text-muted" htmlFor="fullName">
              Nombre completo
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink
                placeholder:text-muted-soft focus:border-primary focus:outline-none"
              placeholder="ej: Carlos Pérez"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-caption text-muted" htmlFor="password">
              {isEditing ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña'}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink
                placeholder:text-muted-soft focus:border-primary focus:outline-none"
              placeholder={isEditing ? '••••••' : 'Mínimo 6 caracteres'}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-caption text-muted" htmlFor="role">
              Rol
            </label>
            <select
              id="role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink
                focus:border-primary focus:outline-none"
            >
              <option value="" disabled>Seleccionar rol</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{displayRole(r.name)}</option>
              ))}
            </select>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-hairline px-4 py-2 text-body-sm text-muted
                transition-colors hover:text-ink"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary
                transition-opacity hover:opacity-90 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
