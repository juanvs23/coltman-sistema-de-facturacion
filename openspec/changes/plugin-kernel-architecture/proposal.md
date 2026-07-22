# Proposal: Plugin Kernel Architecture

## Intent

Eliminar dependencias directas del core hacia periféricos y módulos de negocio específicos. Hoy, agregar restaurante, SENIAT o multi-terminal requiere modificar el core. Se necesita un **kernel mínimo** que exponga un bus de plugins estandarizado: registro, hooks (actions + filters con prioridad), extensión UI y modelos de datos.

## Scope

### In Scope

- Kernel mínimo en `src/main/core/kernel/` — PluginRegistry, HookBus, UiRegistry, DataModelRegistry
- Hook bus: actions (ejecutar código) + filters (modificar datos) con prioridad numérica (WordPress-style)
- Plugin UI Extension: vistas React, menú lateral, tabs de configuración inyectables
- Plugin Data Model: plugins aportan tablas Prisma vía migración con namespace `plugin_<id>_`
- Refactor PluginLoader actual para usar el kernel
- Migración de plugin-ve (country) y fiscal-printer al nuevo sistema
- Actualización de `plugin-api/` con contratos: `IPluginKernel`, `IHookSubscriber`, `IPluginUI`, `IPluginDataModel`

### Out of Scope

- Plugins específicos (restaurante, SENIAT, multi-terminal) — solo infraestructura
- License Manager refactor
- Marketplace UI (store de plugins)
- Hot-reload en desarrollo

## Capabilities

### New Capabilities

- `plugin-registry`: Registro, ciclo de vida (activate/deactivate), descubrimiento desde `plugins/`
- `hook-bus`: Actions + Filters con prioridad, orden de ejecución garantizado
- `plugin-ui-extension`: Puntos de extensión para menú, vistas, settings tabs
- `plugin-data-model`: Plugins aportan `schema.prisma` parcial + migración independiente

### Modified Capabilities

None — capabilities existentes no cambian a nivel spec.

## Approach

```
Kernel (src/main/core/kernel/)
 ├─ PluginRegistry  → register, activate, discover
 ├─ HookBus         → action(name, data, priority), filter(name, payload, priority)
 ├─ UiRegistry      → addMenuItem(), addRoute(), addSettingsTab()
 └─ DataModelReg.  → registerSchema(), runMigration()
        ▲
        │ plugin-api/ contracts
        ├── IPluginKernel
        ├── IHookSubscriber
        ├── IPluginUI
        └── IPluginDataModel
```

Plugin implementa `IPlugin` que extiende los 4 contratos. Kernel itera sobre plugins registrados. Hooks con prioridad 10 corren antes que 20. Filters reciben payload, lo transforman, lo devuelven.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/main/core/kernel/` | **New** | PluginRegistry, HookBus, UiRegistry, DataModelRegistry |
| `src/main/plugins/PluginLoader.ts` | Modified | Usar kernel, eliminar dispatchHook manual |
| `src/renderer/plugins/` | Modified | UiRegistry provee hooks React con lazy loading |
| `plugin-api/src/` | Modified | 4 nuevos contratos + IPlugin extendido |
| `src/shared/` | New | Tipos kernel ↔ renderer (IPC bridge) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Migración rompe funcionalidad actual | Med | Feature flags + test suite completo antes del merge |
| Schemas Prisma conflictivos (nombres duplicados) | Bajo | Namespace forzado: `plugin_<id>_<table>` |
| Performance hook bus en hot path | Bajo | Hooks síncronos, benchmark con 5+ plugins |
| UiRegistry sin lazy loading | Med | React.lazy() + Suspense boundary por defecto |

## Rollback Plan

1. `git revert` commits del cambio
2. Restaurar `src/main/core/` y `plugin-api/src/` desde backup
3. Si hay tablas plugin_* en SQLite, `DROP TABLE IF EXISTS plugin_*`

## Dependencies

- Prisma 6 migration protocol
- electron-vite dynamic import support

## Success Criteria

- [ ] Core arranca sin plugins instalados y todas las features base funcionan
- [ ] Plugin fiscal-printer se registra, activa, y hooks se disparan en prioridad correcta
- [ ] UiRegistry inyecta vista React del plugin en menú lateral
- [ ] HookBus soporta filters: `filter('sale:totals', data)` modifica payload
- [ ] Plugin declara modelo Prisma, kernel ejecuta migración, tabla creada en SQLite
- [ ] Test suite existente (62 tests) pasa sin modificación
