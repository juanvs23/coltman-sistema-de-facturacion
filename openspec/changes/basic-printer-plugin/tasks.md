# Tasks: Basic Printer Plugin

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 850–950 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-always |
| Chain strategy | stacked-to-dev |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-dev
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Contract + formatter + duck-typing | PR 1 → dev | Self-contained, ~250 lines |
| 2 | Plugin + AppKernel slots + PluginLoader | PR 2 → PR 1 | Depends on PR 1, ~380 lines |
| 3 | IPC fallback chain + cleanup | PR 3 → PR 2 | Depends on PR 2, ~300 lines |

---

## Phase 1: Contract & Foundation (PR 1) ✅ COMPLETE

### 1.1 IBasicPrinter contract
- [x] **RED** `src/main/plugins/__tests__/isBasicPrinterPlugin.test.ts` — 6 tests: positive detection (4 methods, no printInvoice), fiscal exclusion, null/primitive safety, missing methods, extra props
- [x] **GREEN** `plugin-api/src/contracts/IBasicPrinter.ts` — 4 methods (testConnection, printReceipt, getStatus, openDrawer), identity fields (type, displayName)
- [x] **REFACTOR** `plugin-api/src/license/types.ts` — add `basic-printer` to BUILT_IN_FEATURES (requiresLicense: false, tier: free)
- [x] `plugin-api/src/index.ts` — export `IBasicPrinter` type

### 1.2 isBasicPrinterPlugin duck-typing
- [x] **GREEN** `src/main/plugins/isBasicPrinterPlugin.ts` — checks printReceipt+testConnection+getStatus+openDrawer (functions), lacks printInvoice
- [x] **REFACTOR** verify tests from 1.1 pass against implementation

### 1.3 ESC/POS formatter
- [x] **RED** `src/main/plugins/built-in/basic-printer/__tests__/escpos-formatter.test.ts` — test header, items, footer, barcode no-op, empty receipt, alignment, no-header, no-footer, drawer kick
- [x] **GREEN** `src/main/plugins/built-in/basic-printer/escpos-formatter.ts` — pure function `formatReceipt(ReceiptData): Buffer` + `formatDrawerKick(): Buffer` using escpos library
- [x] `package.json` — add `escpos` dependency

---

## Phase 2: Plugin & Kernel (PR 2) ✅ COMPLETE

### 2.1 BasicPrinterPlugin
- [x] **RED** `src/main/plugins/built-in/basic-printer/__tests__/BasicPrinterPlugin.test.ts` — 16 tests: manifest identity, activate (connect + fail), deactivate (destroy + idempotent), printReceipt (write + error), openDrawer (write + error), getStatus (online + offline), testConnection (success + error)
- [x] **GREEN** `src/main/plugins/built-in/basic-printer/plugin.json` — manifest: id `basic-printer`, requiresLicense false, built-in
- [x] **GREEN** `src/main/plugins/built-in/basic-printer/BasicPrinterPlugin.ts` — implements IPlugin + IBasicPrinter; net.Socket connect/disconnect, 4 delegated methods, error handling

### 2.2 AppKernel basic printer slots
- [x] **RED** `src/main/core/kernel/__tests__/AppKernel.test.ts` — added 7 tests: register/get/has/unregister, mirror fiscal pattern
- [x] **GREEN** `src/main/core/kernel/AppKernel.ts` — added `_basicPrinterPluginId`, `_basicPrinterInstance`, 5 methods: registerBasicPrinter, registerBasicPrinterInstance, getBasicPrinter, hasBasicPrinterPlugin, unregisterBasicPrinter

### 2.3 PluginLoader integration
- [x] **GREEN** `src/main/plugins/PluginLoader.ts` — added `tryRegisterBasicPrinter()` mirroring fiscal, called in `loadPlugins()`, `togglePlugin()` (activate + deactivate), and `installPlugin()`

---

## Phase 3: IPC Fallback & Cleanup (PR 3)

### 3.1 IPC fallback chain
- [ ] **RED** `src/main/ipc/__tests__/handlers.test.ts` — add tests: fiscal+basic (fiscal wins), basic-only after unlicensed fiscal, no printer error, basic delegates correctly
- [ ] **GREEN** `src/main/ipc/handlers.ts` — refactor 4 handlers (test, print-receipt, status, open-drawer) to fallback chain: fiscal(licensed) → basic(free) → PLUGIN_NOT_AVAILABLE; add `getBasicPrinterOrReject()` helper

### 3.2 Cleanup
- [ ] Delete `src/main/core/ports/IPrinterPort.ts` (unused pre-SDD artifact)
- [ ] Run full test suite: `vitest run` — all tests pass
