# Design: Plugin Kernel Architecture

## Technical Approach

Refactor PluginLoader en discovery-only; registro, hooks, UI y data models se mueven a 4 kernel registries. Plugin-api recibe 4 nuevos contratos. Comunicación con renderer via IPC push bridge.

```
AppKernel (singleton)
 ┌──────────────────────────────────────────┐
 │ PluginRegistry  HookBus  UiRegistry     │
 │ DataModelRegistry                       │
 │   ▲                                     │
 │   │ IPC (webContents.send)              │
 │   ▼                                     │
 │ Renderer PluginContext ◄─ UiRegistry    │
 └──────────────────────────────────────────┘
```

## Architecture Decisions

| Decisión | Opciones | Tradeoffs | Elección |
|----------|----------|-----------|----------|
| HookBus lifecycle | Singleton vs Inyectado | Singleton: acceso global simple en plugin.activate(). Inyectado: testeable pero requiere wiring. | **Singleton** via `AppKernel.getInstance()` |
| PluginLoader fate | Reemplazar vs Refactor | Reemplazar: limpio pero rompe main.ts. Refactor: backward compatible. | **Refactor** — mantiene loadPlugins(), delega al kernel |
| UI IPC bridge | Push (webContents.send) vs Pull (ipcMain.handle) | Push: tiempo real pero acopla kernel a window. Pull: desacoplado pero necesita polling. | **Push** — UiRegistry emite `ui-registry:updated` en mutación |
| DataModel migration | Prisma CLI vs DMMF programmatic | CLI: estable, probado. DMMF: in-process pero API menos madura. | **Prisma CLI** sobre schema parcial |
| Namespace enforcement | Regex vs validator fn | Ambos funcionan. Regex es más simple. | **Regex** — rechazar modelos sin `^plugin_<id>_` |

## Data Flow

```
Startup:
 main.ts → new AppKernel(prisma, mainWindow)
         → new PluginLoader(kernel, licenseManager)
         → kernel.init()  // setup IPC bridge
         → pluginLoader.loadPlugins()
              → discoverPlugin() → PluginManifest
              → kernel.pluginRegistry.register(manifest, factory)
              → for active: pluginRegistry.activate(id)
                   → plugin.activate() llama kernel.hookBus.on() / uiRegistry.* / dataModelRegistry.*

Hook dispatch:
 hookBus.action('sale:completed', {saleId: 1})
   → subscribers sorted by priority (5 → 10 → 20)
   → each fn receives data sequentially

Filter pipeline:
 hookBus.applyFilter('printer:receipt-data', payload)
   → fnA(payload) → fnB(result of fnA) → final payload
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/main/core/kernel/AppKernel.ts` | Create | Singleton container, 4 registries |
| `src/main/core/kernel/PluginRegistry.ts` | Create | Register, activate/deactivate, lifecycle |
| `src/main/core/kernel/HookBus.ts` | Create | Actions + Filters con prioridad, sub/unsub |
| `src/main/core/kernel/UiRegistry.ts` | Create | Menu items, settings tabs, routes; emite IPC |
| `src/main/core/kernel/DataModelRegistry.ts` | Create | Schema validation, migration runner |
| `plugin-api/src/contracts/IPluginKernel.ts` | Create | Kernel interface para plugins |
| `plugin-api/src/contracts/IHookSubscriber.ts` | Create | HookBus contracts (on/off/action/applyFilter) |
| `plugin-api/src/contracts/IPluginUI.ts` | Create | UiRegistry contracts |
| `plugin-api/src/contracts/IPluginDataModel.ts` | Create | registerSchema() contract |
| `plugin-api/src/types.ts` | Modify | Nuevos tipos: HookPriority, UiMenuItem, etc. |
| `src/main/plugins/PluginLoader.ts` | Refactor | Quitar dispatchHook, delegar a PluginRegistry |
| `src/main/main.ts` | Modify | Init kernel, pasar a loader + handlers |
| `src/main/ipc/handlers.ts` | Modify | Recibir kernel, registrar canales UiRegistry |
| `src/shared/types/index.ts` | Modify | Tipos IPC kernel |
| `src/renderer/plugins/PluginProvider.tsx` | Create | React context escuchando UiRegistry IPC |
| `src/renderer/plugins/PluginSidebarItems.tsx` | Create | Renderiza menú items desde UiRegistry |
| `src/renderer/plugins/PluginSettingsTabs.tsx` | Create | Settings tabs con Suspense lazy loading |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | HookBus dispatch priority, filter pipeline | Aislado, sin Electron |
| Unit | PluginRegistry duplicate rejection, lifecycle | Aislado, mocks |
| Unit | DataModelRegistry namespace validation | Aislado, regex |
| Integration | PluginLoader → PluginRegistry flujo completo | Con Prisma SQLite |
| UI | PluginProvider render sin crash | React Testing Library |

## Migration / Rollout

Fases separadas en PRs encadenados a `dev`:
1. **PR 1**: Kernel + contratos (sin cambio funcional, tests pasan)
2. **PR 2**: Refactor PluginLoader → HookBus
3. **PR 3**: UiRegistry IPC + renderer + DataModelRegistry

## Open Questions

- [ ] Kernel recibe BrowserWindow en constructor o via `BrowserWindow.getAllWindows()[0]`?
- [ ] IFiscalPrinter se mantiene como contrato separado o se repliega a IPlugin?
