# Tasks: Fiscal Printer Plugin

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~470 (5 files modified, 2 new test files, ~90 loc each) |
| 400-line budget risk | **High** |
| Chained PRs recommended | **Yes** |
| Suggested split | PR 1 (foundation) → PR 2 (IPC + UI + tests) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Base | Notes |
|------|------|-----------|------|-------|
| 1 | Contract refinement + Kernel methods + PluginLoader detection | PR 1 | `feature/fiscal-printer-plugin` | Pure TypeScript, no UI; ~150 loc |
| 2 | IPC handlers + preload bridges + FiscalTab UI + tests | PR 2 | PR 1 branch | Depends on PR 1 interfaces; ~320 loc |

---

## Phase 1: Contract & Kernel Foundation (PR 1)

- [x] 1.1 **Refine IFiscalPrinter contract** — Add `printInvoice(data: ReceiptData): Promise<PluginResult>` and `FiscalPrinterErrorCode` type (`PRINTER_NOT_FOUND | PAPER_OUT | PRINT_FAILED | LICENSE_REQUIRED`) to `plugin-api/src/contracts/IFiscalPrinter.ts`
- [x] 1.2 **Export new types** — Export `printInvoice`-related types and `FiscalPrinterErrorCode` from `plugin-api/src/index.ts`
- [x] 1.3 **Add getFiscalPrinter to AppKernel** — Add `_fiscalPrinterId: string|null`, `registerFiscalPrinter()`, `registerFiscalPrinterInstance()`, `unregisterFiscalPrinter()`, and synchronous `getFiscalPrinter(): IFiscalPrinter|null` to `src/main/core/kernel/AppKernel.ts` (follow existing country-plugin pattern but synchronous)
- [x] 1.4 **Add fiscal printer registration to PluginLoader** — Add `tryRegisterFiscalPrinter()` duck-type check (`type` + `testConnection`) after plugin activation in `src/main/plugins/PluginLoader.ts`, call `kernel.registerFiscalPrinter()`; add `unregisterFiscalPrinter()` call on plugin deactivation in `togglePlugin()`

## Phase 2: IPC Handlers, Preload & UI (PR 2, depends on PR 1)

- [x] 2.1 **Replace printer IPC stubs with delegation** — In `src/main/ipc/handlers.ts`, replace `printer:test` and `printer:print-receipt` stubs: add license gating via `licenseManager.isFeatureEnabled('fiscal-printer')` → `LICENSE_REQUIRED`, delegate to `kernel.getFiscalPrinter()` → `PRINTER_NOT_FOUND`, catch plugin errors → `PRINT_FAILED | PAPER_OUT`
- [x] 2.2 **Add printer:status and printer:open-drawer handlers** — In `src/main/ipc/handlers.ts`, add `printer:status` (return `getStatus()` result) and `printer:open-drawer` (delegate to plugin) with same license guard
- [x] 2.3 **Add preload bridges** — Add `getPrinterStatus()` and `openDrawer()` to `src/main/preload.ts` contextBridge exposing `printer:status` and `printer:open-drawer` IPC channels
- [x] 2.4 **Enhance FiscalTab UI** — In `src/renderer/settings/organisms/FiscalTab.tsx`: add "Probar conexión" button (triggers `testPrinter()`, shows success/error), printer status indicator (online/offline, paper, drawer), and license-aware disable on the `printerEnabled` toggle (check license validity on load)

## Phase 3: Tests

- [x] 3.1 **Test AppKernel.getFiscalPrinter()** — In `src/main/core/kernel/__tests__/AppKernel.test.ts`, add tests: returns registered instance, returns null when none, returns null on unregister (follow existing `getCountryPlugin` test pattern)
- [x] 3.2 **Test printer IPC handlers** — Create `src/main/ipc/__tests__/handlers.test.ts`: mock `kernel.getFiscalPrinter()` and `licenseManager.isFeatureEnabled()`, verify license reject, null-plugin reject, delegate pass-through, error code mapping for `printer:test`, `printer:print-receipt`, `printer:status`, `printer:open-drawer`

## Acceptance Criteria

- [x] `IFiscalPrinter` interface includes `printInvoice()` and `FiscalPrinterErrorCode` type
- [x] `AppKernel.getFiscalPrinter()` returns registered plugin or `null` synchronously
- [x] `PluginLoader` auto-detects and registers fiscal printer plugins via duck-typing
- [x] `printer:test` IPC rejects with `LICENSE_REQUIRED` when no license, delegates when valid
- [x] `printer:print-receipt` delegates data to plugin and maps errors to codes
- [x] `printer:status` and `printer:open-drawer` are handled via preload bridges
- [x] `FiscalTab` shows test button, status indicator, and disables toggle on invalid license
- [x] All unit tests pass (`AppKernel.test.ts` + `handlers.test.ts`)
- [x] All Spanish messages match spec (`specs/fiscal-printer-ui/spec.md`)
