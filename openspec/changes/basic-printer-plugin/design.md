# Design: Basic (Non-Fiscal) Printer Plugin

## Technical Approach

Mirror the existing fiscal printer pattern end-to-end: a separate `IBasicPrinter` contract, an AppKernel slot (4 methods), PluginLoader duck-typing, and an IPC fallback chain. Reuses `ReceiptData`/`ReceiptLine` from `IFiscalPrinter` (zero type duplication). The built-in plugin connects via TCP to `localhost:9100`, formats receipts to ESC/POS using the `escpos` library, and never checks licenses.

**Fallback chain** (applies to all printer IPC handlers: test, print-receipt, status, open-drawer):
1. Fiscal licensed → `IFiscalPrinter`
2. Basic registered → `IBasicPrinter` (no license check)
3. Neither → `PLUGIN_NOT_AVAILABLE`

## Architecture Decisions

| Decision | Chosen | Rejected | Rationale |
|----------|--------|----------|-----------|
| Contract separation | `IBasicPrinter` independent of `IFiscalPrinter` | Extend IFiscalPrinter, make printInvoice optional | Avoids fiscal semantics leaking into free tier; duck-typing distinguishes them by `printInvoice` absence |
| Kernel slots | Mirror fiscal: `registerBasicPrinter()`, `getBasicPrinter()`, `hasBasicPrinter()`, `unregisterBasicPrinter()` (separate fields) | Generic printer slot with type discriminator | Simpler; each printer type maps cleanly to its own fallback path |
| ESC/POS format | Pure function `formatReceipt(data: ReceiptData): Buffer` using `escpos` (lsongdev) | Instance method on plugin class | Testable in isolation, no mock TCP socket needed |
| IPC fallback order | Fiscal first, basic second | Basic first (free always wins) | Users with paid fiscal licenses must use them; basic is fallback only |

## Data Flow

```
IPC handler (e.g. printer:print-receipt)
  │
  ├─ [1] checkFiscalLicense(licenseManager)
  │       │ valid ──► getFiscalPrinterOrReject(kernel)
  │       │              │ active ──► IFiscalPrinter.printReceipt(data) ──► return
  │       │
  │       ▼ license invalid OR no fiscal plugin
  │
  ├─ [2] kernel.hasBasicPrinter()?
  │       │ yes ──► kernel.getBasicPrinter()?.printReceipt(data) ──► return
  │       │
  │       ▼ no
  │
  └─ [3] { success: false, error: "PLUGIN_NOT_AVAILABLE" }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `plugin-api/src/contracts/IBasicPrinter.ts` | Create | 4 async methods: testConnection, printReceipt, getStatus, openDrawer; identity fields type/displayName |
| `plugin-api/src/license/types.ts` | Modify | Add `basic-printer` to `BUILT_IN_FEATURES` (free tier) |
| `plugin-api/src/index.ts` | Modify | Export `IBasicPrinter` type |
| `src/main/plugins/built-in/basic-printer/index.ts` | Create | Plugin entry: exports `BasicPrinterPlugin` class |
| `src/main/plugins/built-in/basic-printer/BasicPrinterPlugin.ts` | Create | Implements `IPlugin` + `IBasicPrinter`; manages TCP socket lifecycle |
| `src/main/plugins/built-in/basic-printer/plugin.json` | Create | Manifest: id `basic-printer`, requiresLicense `false` |
| `src/main/plugins/built-in/basic-printer/escpos-formatter.ts` | Create | Pure function `formatReceipt(ReceiptData): Buffer` |
| `src/main/plugins/built-in/basic-printer/__tests__/BasicPrinterPlugin.test.ts` | Create | Unit tests for plugin lifecycle + TCP mock |
| `src/main/plugins/built-in/basic-printer/__tests__/escpos-formatter.test.ts` | Create | Unit tests for ESC/POS byte output |
| `src/main/plugins/isBasicPrinterPlugin.ts` | Create | Duck-typing: has printReceipt + testConnection + getStatus + openDrawer, lacks printInvoice |
| `src/main/plugins/__tests__/isBasicPrinterPlugin.test.ts` | Create | Positive detection, fiscal exclusion, null-safe |
| `src/main/core/kernel/AppKernel.ts` | Modify | Add `_basicPrinterPluginId`, `_basicPrinterInstance`, 4 methods mirroring fiscal pattern |
| `src/main/core/kernel/__tests__/AppKernel.test.ts` | Modify | Add tests for basic printer register/get/has/unregister |
| `src/main/plugins/PluginLoader.ts` | Modify | Add `tryRegisterBasicPrinter()` called after activation; call in `togglePlugin` too |
| `src/main/ipc/handlers.ts` | Modify | Refactor 4 printer handlers to fallback chain; add `getBasicPrinterOrReject()` helper |
| `src/main/ipc/__tests__/handlers.test.ts` | Modify | Test fallback: fiscal-only, basic-only, none, unlicensed fiscal |
| `src/main/core/ports/IPrinterPort.ts` | Delete | Unused pre-SDD artifact with incompatible types |
| `package.json` | Modify | Add `escpos` dependency |

## Interfaces / Contracts

```ts
// plugin-api/src/contracts/IBasicPrinter.ts
import type { PluginResult } from '../types'
import type { ReceiptData } from './IFiscalPrinter'

export interface IBasicPrinter {
  readonly type: 'basic-printer'
  readonly displayName: string
  testConnection(): Promise<PluginResult>
  printReceipt(data: ReceiptData): Promise<PluginResult>
  getStatus(): Promise<PluginResult<{ online: boolean; paperOut: boolean; drawerOpen: boolean }>>
  openDrawer(): Promise<PluginResult>
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit — escpos-formatter | ReceiptData → ESC/POS bytes | Pure function tests: header, items, footer, barcode no-op, drawer kick |
| Unit — isBasicPrinterPlugin | Duck-typing detection | Positive case (has all 4 methods, lacks printInvoice), fiscal exclusion, null/primitive safety |
| Unit — AppKernel | register/get/has/unregister slots | Mirror existing fiscal printer tests |
| Unit — BasicPrinterPlugin | activate/deactivate, connect/disconnect | Mock `net.Socket`; test reconnect on failure |
| Integration — handlers | Fallback chain: fiscal → basic → error | Mock kernel + license manager; verify delegation order |

## Migration / Rollout

No DB migrations. Rollback: delete `basic-printer/` directory, remove `IBasicPrinter` + its export, revert AppKernel + IPC handlers to fiscal-only paths, remove `escpos` dep.

## Open Questions

- [ ] `escpos` ESM/CJS compatibility with Electron 32 + Vite bundler — verify early; fallback to raw `net.Socket` buffer writes if build fails
