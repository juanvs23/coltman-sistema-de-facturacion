import { useState, useEffect } from 'react'

interface PermissionItem {
  id: string
  handler: string
  description: string
  category: string
}

interface RoleItem {
  id: string
  name: string
  description?: string
  editable: boolean
  permissions: string[]
  userCount: number
  createdAt: string
}

const ROLE_DISPLAY: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  seller: 'Vendedor'
}

function displayRole(name: string): string {
  return ROLE_DISPLAY[name] ?? name
}

const PERMISSION_CATEGORIES = [
  'inventory',
  'taxes',
  'customers',
  'sales',
  'cash',
  'reports',
  'config',
  'printer',
  'admin'
] as const

const CATEGORY_LABELS: Record<string, string> = {
  inventory: 'Inventario',
  taxes: 'Impuestos',
  customers: 'Clientes',
  sales: 'Ventas',
  cash: 'Caja',
  reports: 'Reportes',
  config: 'Configuracion',
  printer: 'Impresora',
  admin: 'Administracion'
}

function groupPermissions(permissions: PermissionItem[]): Record<string, PermissionItem[]> {
  const groups: Record<string, PermissionItem[]> = {}
  for (const cat of PERMISSION_CATEGORIES) {
    groups[cat] = permissions.filter(p => p.category === cat)
  }
  return groups
}

interface RoleModalProps {
  role: RoleItem | null
  permissions: PermissionItem[]
  onClose: () => void
  onSave: (data: { name: string; description?: string; permissions: string[] }) => Promise<void>
}

function RoleModal({ role, permissions, onClose, onSave }: RoleModalProps): JSX.Element {
  const isEditing = role !== null
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (role) {
      setName(role.name)
      setDescription(role.description ?? '')
      setSelectedPermissions(new Set(role.permissions))
    }
  }, [role])

  const grouped = groupPermissions(permissions)

  const togglePermission = (handler: string) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev)
      if (next.has(handler)) {
        next.delete(handler)
      } else {
        next.add(handler)
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('El nombre del rol es obligatorio')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        permissions: Array.from(selectedPermissions)
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-lg bg-surface-card p-6 shadow-lg">
        <h3 className="text-title-sm text-ink">
          {isEditing ? 'Editar rol' : 'Crear rol'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {error && (
            <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-caption text-muted" htmlFor="roleName">Nombre</label>
            <input
              id="roleName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none"
              placeholder="ej: supervisor"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-caption text-muted" htmlFor="roleDesc">Descripcion</label>
            <input
              id="roleDesc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none"
              placeholder="Descripcion opcional del rol"
            />
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-caption text-muted">Permisos</p>
            {PERMISSION_CATEGORIES.map(cat => {
              const items = grouped[cat]
              if (!items || items.length === 0) return null
              return (
                <div key={cat}>
                  <p className="text-caption font-medium text-ink mb-1">{CATEGORY_LABELS[cat] ?? cat}</p>
                  <div className="flex flex-col gap-1">
                    {items.map(p => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.has(p.handler)}
                          onChange={() => togglePermission(p.handler)}
                          className="rounded border-hairline text-primary focus:ring-primary"
                        />
                        <span className="text-body-sm text-ink">{p.description}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-hairline px-4 py-2 text-body-sm text-muted transition-colors hover:text-ink"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SecurityTab(): JSX.Element {
  const [timeout, setTimeout_] = useState(600)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [roles, setRoles] = useState<RoleItem[]>([])
  const [permissions, setPermissions] = useState<PermissionItem[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [rolesError, setRolesError] = useState('')
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null)
  const [showCreateRole, setShowCreateRole] = useState(false)

  const loadRoles = async () => {
    setRolesLoading(true)
    setRolesError('')
    try {
      const [rolesRes, permsRes] = await Promise.all([
        window.electronAPI.listRoles(),
        window.electronAPI.listPermissions()
      ])
      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data)
      } else {
        setRolesError(rolesRes.error ?? 'Error al cargar roles')
      }
      if (permsRes.success && permsRes.data) {
        setPermissions(permsRes.data)
      }
    } catch {
      setRolesError('Error de conexion')
    } finally {
      setRolesLoading(false)
    }
  }

  useEffect(() => {
    window.electronAPI.getConfig().then((res) => {
      if (res.success && res.data?.inactivityTimeout) {
        setTimeout_(res.data.inactivityTimeout)
      }
    })
    loadRoles()
  }, [])

  const handleSaveTimeout = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await window.electronAPI.updateConfig({ inactivityTimeout: timeout })
      if (res.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setError(res.error ?? 'Error al guardar')
      }
    } catch {
      setError('Error de conexion')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateRole = async (data: { name: string; description?: string; permissions: string[] }) => {
    const res = await window.electronAPI.createRole(data)
    if (!res.success) throw new Error(res.error)
    setShowCreateRole(false)
    await loadRoles()
  }

  const handleUpdateRole = async (data: { name: string; description?: string; permissions: string[] }) => {
    if (!editingRole) return
    const res = await window.electronAPI.updateRole(editingRole.id, data)
    if (!res.success) throw new Error(res.error)
    setEditingRole(null)
    await loadRoles()
  }

  const handleDeleteRole = async (role: RoleItem) => {
    if (!confirm(`Eliminar el rol "${displayRole(role.name)}"?`)) return
    const res = await window.electronAPI.deleteRole(role.id)
    if (res.success) {
      await loadRoles()
    } else {
      alert(res.error ?? 'Error al eliminar rol')
    }
  }

  const minutes = Math.floor(timeout / 60)
  const remainingSeconds = timeout % 60

  return (
    <div className="max-w-2xl space-y-8">
      {/* Roles y permisos */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-title-sm text-ink">Roles y permisos</h3>
            <p className="mt-1 text-body-sm text-muted">
              Gestion de roles del sistema y los permisos asociados a cada uno.
            </p>
          </div>
          <button
            onClick={() => setShowCreateRole(true)}
            className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary transition-opacity hover:opacity-90"
          >
            + Crear rol
          </button>
        </div>

        {rolesError && (
          <div className="mt-3 rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
            {rolesError}
            <button onClick={loadRoles} className="ml-2 underline">Reintentar</button>
          </div>
        )}

        {rolesLoading && (
          <div className="mt-4 flex items-center justify-center py-8">
            <p className="text-body-sm text-muted-soft">Cargando roles...</p>
          </div>
        )}

        {!rolesLoading && (
          <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-canvas">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft/50">
                  <th className="px-4 py-3 text-left font-medium text-ink">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-ink">Descripcion</th>
                  <th className="px-4 py-3 text-left font-medium text-ink">Usuarios</th>
                  <th className="px-4 py-3 text-left font-medium text-ink">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {roles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-soft">
                      No hay roles registrados
                    </td>
                  </tr>
                )}
                {roles.map(role => (
                  <tr key={role.id}>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-caption font-medium
                        ${role.name === 'superadmin'
                          ? 'bg-error/10 text-error'
                          : role.name === 'admin'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-surface-strong text-ink'
                        }`}>
                        {displayRole(role.name)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {role.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted">{role.userCount}</td>
                    <td className="px-4 py-3">
                      {role.editable && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingRole(role)}
                            className="rounded px-2 py-1 text-caption text-muted transition-colors hover:bg-surface-soft hover:text-ink"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="rounded px-2 py-1 text-caption text-error transition-colors hover:bg-error/10"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bloqueo por inactividad */}
      <section>
        <h3 className="text-title-sm text-ink">Bloqueo por inactividad</h3>
        <p className="mt-1 text-body-sm text-muted">
          Si no hay actividad del usuario durante el tiempo indicado, la sesion se bloquea y requiere clave para continuar.
          Los datos en pantalla no se pierden durante el bloqueo.
        </p>

        <div className="mt-4 rounded-lg border border-hairline bg-canvas p-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-body-sm font-medium text-ink mb-1">
                Tiempo de inactividad (segundos)
              </label>
              <input
                type="number"
                min={60}
                max={7200}
                step={60}
                value={timeout}
                onChange={(e) => setTimeout_(parseInt(e.target.value) || 600)}
                className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-body-md text-ink focus:border-ink focus:outline-none"
              />
              <p className="mt-1 text-caption text-muted-soft">
                Equivale a {minutes} minuto{minutes !== 1 ? 's' : ''}{remainingSeconds > 0 ? ` ${remainingSeconds} segundo${remainingSeconds !== 1 ? 's' : ''}` : ''}
              </p>
            </div>
            <button
              onClick={handleSaveTimeout}
              disabled={saving}
              className="h-10 rounded-md bg-primary px-5 text-button text-on-primary transition-colors hover:bg-primary-active disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
          {saved && (
            <p className="mt-3 text-body-sm text-success">Configuracion guardada</p>
          )}
          {error && (
            <p className="mt-3 text-body-sm text-error">{error}</p>
          )}
        </div>
      </section>

      {/* Politicas de contrasena */}
      <section>
        <h3 className="text-title-sm text-ink">Politicas de contrasena</h3>
        <p className="mt-1 text-body-sm text-muted">
          Requisitos que deben cumplir las contrasenas de usuarios nuevos y cambios de contrasena.
        </p>

        <div className="mt-4 rounded-lg border border-hairline bg-canvas p-6">
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-xs text-success">&#10003;</span>
              <span className="text-body-sm text-ink">Minimo 8 caracteres de longitud</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-xs text-success">&#10003;</span>
              <span className="text-body-sm text-ink">Al menos una letra mayuscula (A-Z)</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-xs text-success">&#10003;</span>
              <span className="text-body-sm text-ink">Al menos una letra minuscula (a-z)</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-xs text-success">&#10003;</span>
              <span className="text-body-sm text-ink">Al menos un numero (0-9)</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Control de acceso (legacy static table) */}
      <section>
        <h3 className="text-title-sm text-ink">Control de acceso</h3>
        <p className="mt-1 text-body-sm text-muted">
          Permisos por rol dentro del sistema. La gestion de usuarios se realiza en la pestana Usuarios.
        </p>

        <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-canvas">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-hairline bg-surface-soft/50">
                <th className="px-4 py-3 text-left font-medium text-ink">Rol</th>
                <th className="px-4 py-3 text-left font-medium text-ink">Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              <tr>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-surface-strong px-2 py-0.5 text-caption font-medium text-ink">Vendedor</span>
                </td>
                <td className="px-4 py-3 text-muted">
                  Punto de venta, busqueda de productos, clientes, facturacion, reportes y consulta de caja
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-warning/10 px-2 py-0.5 text-caption font-medium text-warning">Administrador</span>
                </td>
                <td className="px-4 py-3 text-muted">
                  Todo lo del vendedor + crear/editar productos, impuestos, clientes, configuracion y caja
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-error/10 px-2 py-0.5 text-caption font-medium text-error">Superadmin</span>
                </td>
                <td className="px-4 py-3 text-muted">
                  Acceso total al sistema: gestion de usuarios, plugins y toda la configuracion
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Role Modals */}
      {showCreateRole && (
        <RoleModal
          role={null}
          permissions={permissions}
          onClose={() => setShowCreateRole(false)}
          onSave={handleCreateRole}
        />
      )}

      {editingRole && (
        <RoleModal
          role={editingRole}
          permissions={permissions}
          onClose={() => setEditingRole(null)}
          onSave={handleUpdateRole}
        />
      )}
    </div>
  )
}
