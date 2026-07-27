# Design: Fiscal Printer Plugin

## Technical Approach

Refine the existing `IFiscalPrinter` contract, wire it through `AppKernel` (same pattern as `getCountryPlugin`), replace IPC stubs with real delegation + license gating, and add printer test/status UI in `FiscalTab`. The plugin loader already supports `plugins/` directory loading — no changes needed there.

## Architecture Overview

```
┌── Renderer ────────────────────────────────────────────┐
│  FiscalTab ──IPC──▶ preload.ts ──invoke──▶ handlers.ts │
└────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┤
         ▼                ▼
┌── Main Process ────────────────────────────────────────┐
│  handlers.ts     LicenseManager.isFeatureEnabled()     │
│       │           ("fiscal-printer")                   │
│       ▼                                               │
│  AppKernel.getFiscalPrinter() ──▶ IFiscalPrinter|null  │
│       │                                               │
│       ▼                                               │
│  PluginLoader (plugins/ dir) ──▶ FiscalPrinterPlugin   │
└────────────────────────────────────────────────────────┘
```

## Architecture Decisions

| # | Decision | Options | Choice | Rationale |
|---|----------|---------|--------|-----------|
| D1 | Contract location | `plugin-api/src/contracts/IFiscalPrinter.ts` (existing) or `src/main/core/ports/` | Keep in `plugin-api/` | Already defined there; plugins import `@plugin-api`; core ports pattern (`src/main/core/ports/`) is for repositories, not plugin contracts |
| D2 | Kernel pattern | New registry or reuse `getCountryPlugin()` pattern (map + instance) | Reuse country plugin pattern | Same structure: one active plugin of a type at a time, resolved via map — add `_fiscalPrinterPluginId` + `_fiscalPrinterInstance` + `getFiscalPrinter()` |
| D3 | Error codes | Extend `PluginResult` vs string codes in `error` field | String codes in `error` field | `PluginResult.error` is already `string`; define `FiscalPrinterErrorCode` type (`PRINTER_NOT_FOUND \| PAPER_OUT \| PRINT_FAILED \| LICENSE_REQUIRED`); UI maps to Spanish messages |
| D4 | Plugin auto-detection | `instanceof` guard vs duck typing | Duck typing (check `type` + `testConnection` exist) | TS interfaces have no runtime `instanceof`; follows `tryRegisterCountryPlugin`'s duck-type pattern |
| D5 | License gating location | In IPC handler vs in plugin's `activate()` | IPC handler (pre-call gate) | Non-invasive — plugin doesn't know about licensing; handler checks before delegating; same pattern as `isFeatureEnabled` usage in `installPlugin` |

## Data Flow

### testPrinter (IPC: `printer:test`)
```
FiscalTab.testConnection()
  → ipcRenderer.invoke('printer:test')
    → guard() [auth check]
    → licenseManager.isFeatureEnabled('fiscal-printer')
      → ✗ → { success: false, error: 'LICENSE_REQUIRED' }
    → kernel.getFiscalPrinter()
      → null → { success: false, error: 'PRINTER_NOT_FOUND' }
    → plugin.testConnection()
      → { success: true } | { success: false, error: 'PRINTER_NOT_FOUND' }
```

### printReceipt (IPC: `printer:print-receipt`)
```
POS screen
  → ipcRenderer.invoke('printer:print-receipt', receiptData)
    → guard() [auth check]
    → licenseManager.isFeatureEnabled('fiscal-printer')
      → ✗ → { success: false, error: 'LICENSE_REQUIRED' }
    → kernel.getFiscalPrinter()
      → null → { success: false, error: 'PRINTER_NOT_FOUND' }
    → plugin.printReceipt(data)
      → try/catch → { success: false, error: 'PRINT_FAILED' | 'PAPER_OUT' }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `plugin-api/src/contracts/IFiscalPrinter.ts` | Modify | Add `printInvoice()`, `FiscalPrinterErrorCode` type, add `FiscalConfig` param to `testConnection` |
| `plugin-api/src/index.ts` | Modify | Export new `FiscalPrinterErrorCode` type |
| `src/main/core/kernel/AppKernel.ts` | Modify | Add `registerFiscalPrinter()`, `registerFiscalPrinterInstance()`, `getFiscalPrinter()`, internal maps |
| `src/main/plugins/PluginLoader.ts` | Modify | Add `tryRegisterFiscalPrinter()` duck-type check after `activate()`, call `kernel.registerFiscalPrinter()` |
| `src/main/ipc/handlers.ts` | Modify | Replace `printer:test` and `printer:print-receipt` stubs with kernel delegation + license gating |
| `src/main/ipc/handlers.ts` | Modify | Add `printer:status` and `printer:open-drawer` handlers |
| `src/main/preload.ts` | Modify | Add `getPrinterStatus()` and `openDrawer()` bridges |
| `src/renderer/settings/organisms/FiscalTab.tsx` | Modify | Add test button, printer status indicator, license-aware toggle disable |
| `src/main/core/kernel/__tests__/AppKernel.test.ts` | Modify | Add `getFiscalPrinter()` tests |
| `src/main/ipc/__tests__/handlers.test.ts` | Create | Test printer IPC handlers with mocked kernel + license |

## Interfaces / Contracts

### IFiscalPrinter (refined)

```ts
export type FiscalPrinterErrorCode =
  | 'PRINTER_NOT_FOUND'
  | 'PAPER_OUT'
  | 'PRINT_FAILED'
  | 'LICENSE_REQUIRED'

export interface IFiscalPrinter {
  readonly type: FiscalPrinterType
  readonly displayName: string
  testConnection(): Promise<PluginResult>
  printReceipt(data: ReceiptData): Promise<PluginResult>
  printInvoice(data: ReceiptData): Promise<PluginResult>    // NEW
  openDrawer(): Promise<PluginResult>
  getStatus(): Promise<PluginResult<{ online: boolean; paperOut: boolean; drawerOpen: boolean }>>
  printDailyReport?(totals: { salesCount: number; totalAmount: number; taxTotal: number }): Promise<PluginResult>
}
```

### AppKernel additions
```ts
// New public method
getFiscalPrinter(): IFiscalPrinter | null   // synchronous, no DB lookup

// New internal methods (called by PluginLoader)
registerFiscalPrinter(pluginId: string): void
registerFiscalPrinterInstance(pluginId: string, instance: IFiscalPrinter): void
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `AppKernel.getFiscalPrinter()` | Follow existing `getCountryPlugin` test pattern — register mock, verify return |
| Unit | IPC handlers | Mock `kernel.getFiscalPrinter()`, `licenseManager.isFeatureEnabled()`; verify license reject, null-plugin reject, delegate pass-through, error code mapping |
| Component | `FiscalTab` test button states | React Testing Library: render, click test button, verify IPC mock called, verify loading/success/error states render |
| Integration | Plugin auto-detection | Mock plugin implementing `IFiscalPrinter`, run `tryRegisterFiscalPrinter()`, verify kernel registers instance |

## Migration / Rollout

No migration. Feature is gated behind license — users without `fiscal-printer` license see existing stub behavior (`Not implemented`). Existing `FiscalConfig` schema unchanged.

## Open Questions

- None — all design decisions are resolved.
