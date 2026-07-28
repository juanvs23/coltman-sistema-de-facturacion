# Proposal: Basic (Non-Fiscal) Printer Plugin

## Intent

Any PYME needs to print tickets without fiscal compliance or paid license. Provide a built-in plugin using standard ESC/POS over TCP (localhost:9100 or real printer) as a free, no-license-check fallback when no fiscal printer is available.

## Scope

| Area | In Scope | Out of Scope |
|------|----------|-------------|
| Contract | `IBasicPrinter`: testConnection, printReceipt, openDrawer | `printInvoice`, `printDailyReport`, `getStatus` |
| Plugin | Built-in at `src/main/plugins/built-in/basic-printer/` | External/user-installed plugins |
| Communication | TCP only (localhost:9100 default) | Serial/USB (`serialport`), Bluetooth |
| Kernel | AppKernel slots mirroring fiscal pattern | LicenseManager changes |
| IPC | Fallback chain: fiscal(licensed) → basic(free) | New IPC channels (reuse existing printer:* ) |
| UI | No changes (transparent to ReceiptConfirm) | FiscalTab basic printer section |

## Capabilities

### New Capabilities
- `basic-printer-contract`: IBasicPrinter interface, reuse ReceiptData from IFiscalPrinter, `basic-printer` free feature in BUILT_IN_FEATURES
- `basic-printer-plugin`: Built-in ESC/POS plugin (TCP connection, receipt formatter, plugin.json manifest with requiresLicense: false)
- `basic-printer-kernel`: AppKernel registerBasicPrinter/getBasicPrinter/hasBasicPrinter slots

### Modified Capabilities
- `fiscal-printer-ipc`: Printer IPC handlers SHALL fallback to basic printer when fiscal is unavailable or unlicensed; basic path MUST NOT check license

## Approach

**Approach 1 (Recommended)**: Separate `IBasicPrinter` contract + built-in plugin with duck-typing detection. IPC handlers implement priority chain. Reuses existing `ReceiptData` and `ReceiptLine` types from `IFiscalPrinter` (zero type duplication). TCP-only avoids native dependency rebuilds.

Fallback chain per handler (`printReceipt`, `testConnection`, `openDrawer`):
1. If fiscal configured AND license valid → delegate to IFiscalPrinter
2. Else if basic plugin registered → delegate to IBasicPrinter
3. Else → `PLUGIN_NOT_AVAILABLE`

Delete unused `IPrinterPort` in `src/main/core/ports/` (pre-SDD artifact with incompatible types).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `plugin-api/src/contracts/IBasicPrinter.ts` | New | Contract: testConnection(), printReceipt(), openDrawer() |
| `plugin-api/src/license/types.ts` | Modified | Add `basic-printer` free feature |
| `plugin-api/src/index.ts` | Modified | Export IBasicPrinter |
| `src/main/plugins/built-in/basic-printer/` | New | Plugin: index.ts, EscPosPrinter.ts, plugin.json |
| `src/main/plugins/isBasicPrinterPlugin.ts` | New | Duck-typing: has printReceipt+testConnection, NOT printInvoice |
| `src/main/core/kernel/AppKernel.ts` | Modified | Add basic printer slots (register/get/has) |
| `src/main/ipc/handlers.ts` | Modified | Fallback chain: fiscal → basic → error |
| `src/main/plugins/PluginLoader.ts` | Modified | Add `tryRegisterBasicPrinter()` |
| `src/main/core/ports/IPrinterPort.ts` | Removed | Unused pre-SDD artifact |
| `package.json` | Modified | Add `escpos` dependency |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `escpos` ESM incompatibility with Electron 32 | Medium | Validate early; fallback to raw `net.Socket` writes if needed |
| Duck-typing false positive (basic mistaken as fiscal) | Low | Checks absence of `printInvoice`; unit test this case |
| No persistent TCP config | Low | Default localhost:9100; `electron-store` for custom config deferred |
| Barcode lines unsupported in MVP | Low | No-op barcode type in ReceiptFormatter; document as deferred |

## Rollback Plan

Delete `src/main/plugins/built-in/basic-printer/`. Remove `IBasicPrinter` contract and its export. Revert IPC handlers to single-path (fiscal-only). Remove AppKernel basic printer slots and feature definition. No DB migrations to undo.

## Dependencies

- `escpos` (npm) — ESC/POS command generation; alternative: raw `net.Socket` buffer writes
- No external services, no DB migrations

## Success Criteria

- [ ] Plugin activates and registers via PluginLoader without license check
- [ ] `testConnection` succeeds against escpos-emulator on localhost:9100
- [ ] `printReceipt` outputs valid ESC/POS bytes on emulator
- [ ] `openDrawer` sends correct drawer kick pulse
- [ ] IPC fallback: with no fiscal plugin, basic prints successfully
- [ ] IPC fallback: with unlicensed fiscal, basic still prints
- [ ] Duck-typing correctly distinguishes basic plugin from fiscal plugin
- [ ] Unused `IPrinterPort` deleted; all tests pass
