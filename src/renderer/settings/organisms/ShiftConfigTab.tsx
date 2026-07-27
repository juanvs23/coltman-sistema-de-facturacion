import { useState, useEffect, useCallback } from 'react'
import type { ShiftConfigData } from '@shared/types'
import { parseShiftDays, formatShiftDays } from '@shared/types'

const WEEKDAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' }
]

interface FormState {
  id?: string
  name: string
  days: number[]
  startTime: string
  endTime: string
  order: number
  active: boolean
}

const EMPTY_FORM: FormState = { name: '', days: [], startTime: '08:00', endTime: '14:00', order: 0, active: true }

export default function ShiftConfigTab(): JSX.Element {
  const [configs, setConfigs] = useState<ShiftConfigData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [editing, setEditing] = useState<FormState | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.listShiftConfigs()
    if (res.success) setConfigs(res.data ?? [])
    else setError(res.error ?? 'Error al cargar')
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (): Promise<void> => {
    if (!editing) return
    if (!editing.name.trim()) { setError('El nombre es requerido'); return }
    if (editing.days.length === 0) { setError('Seleccione al menos un día'); return }

    setError('')
    const res = await window.electronAPI.saveShiftConfig(editing)
    if (res.success) {
      setSaved('Turno guardado')
      setTimeout(() => setSaved(''), 2000)
      setEditing(null)
      load()
    } else {
      setError(res.error ?? 'Error al guardar')
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('¿Eliminar este turno?')) return
    const res = await window.electronAPI.deleteShiftConfig(id)
    if (res.success) { load() }
    else { setError(res.error ?? 'Error al eliminar') }
  }

  const toggleDay = (day: number): void => {
    if (!editing) return
    setEditing({
      ...editing,
      days: editing.days.includes(day)
        ? editing.days.filter(d => d !== day)
        : [...editing.days, day].sort()
    })
  }

  if (loading) return <p className="text-body-sm text-muted-soft py-8 text-center">Cargando...</p>

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-title-sm text-ink">Configuración de Turnos</h3>
        <button onClick={() => setEditing({ ...EMPTY_FORM, order: configs.length + 1 })}
          className="rounded-md bg-primary px-3 py-1.5 text-body-sm text-on-primary hover:opacity-90">
          + Nuevo turno
        </button>
      </div>

      {error && <div className="mb-3 rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>}
      {saved && <div className="mb-3 rounded-md bg-success/10 px-3 py-2 text-body-sm text-success">{saved}</div>}

      {/* Edit form */}
      {editing && (
        <div className="mb-6 rounded-lg border border-hairline bg-surface-card p-4 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-caption text-muted">Nombre del turno</label>
            <input type="text" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
              placeholder="Turno Mañana"
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-caption text-muted">Días de la semana</label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map(wd => (
                <button key={wd.value} type="button"
                  onClick={() => toggleDay(wd.value)}
                  className={`rounded-full px-3 py-1 text-caption font-medium transition-colors ${
                    editing.days.includes(wd.value)
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-soft text-muted hover:text-ink'
                  }`}>
                  {wd.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted">Hora inicio</label>
              <input type="time" value={editing.startTime} onChange={e => setEditing({ ...editing, startTime: e.target.value })}
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-caption text-muted">Hora fin</label>
              <input type="time" value={editing.endTime} onChange={e => setEditing({ ...editing, endTime: e.target.value })}
                className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none" />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(null)}
              className="rounded-md border border-hairline px-4 py-2 text-body-sm text-muted hover:text-ink">Cancelar</button>
            <button onClick={handleSave}
              className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary hover:opacity-90">
              {editing.id ? 'Actualizar' : 'Crear turno'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {configs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-body-sm text-muted-soft">No hay turnos configurados</p>
          <p className="text-caption text-muted-soft mt-1">Cree turnos para seleccionar al abrir caja</p>
        </div>
      ) : (
        <div className="space-y-2">
          {configs.map(c => {
            const days = parseShiftDays(c.days)
            return (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-hairline bg-surface-card px-4 py-3">
                <div>
                  <p className="text-body-sm font-medium text-ink">{c.name}</p>
                  <p className="text-caption text-muted">
                    {formatShiftDays(days)} · {c.startTime} a {c.endTime}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing({
                    id: c.id, name: c.name, days, startTime: c.startTime,
                    endTime: c.endTime, order: c.order, active: c.active
                  })}
                    className="text-caption font-medium text-primary hover:underline">Editar</button>
                  <button onClick={() => handleDelete(c.id)}
                    className="text-caption font-medium text-error hover:underline">Eliminar</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
