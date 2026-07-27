# Proposal: Fiscal Printer Plugin

## Intent

Add hardware fiscal printer support (Bixolon SRP-275/SRP-350, Epson TM-T88V/TM-U220, Sharp UP-X300, SAM4s Ellix) via a plugin implementing `IFiscalPrinter`. The contract, data model (`FiscalConfig`), UI (`FiscalTab`), IPC stubs, and license gating already exist — only the implementation is missing.

## Scope

| Area | In Scope | Out of Scope |
|------|----------|-------------|
| Plugin | Single `fiscal-printer` plugin with 4 brand adapters | Separate plugins per brand |
| Communication | Serial (COM/USB) via `escpos` + `serialport` | Network/IP printers, Bluetooth |
| Features | `testConnection`, `printReceipt`, `openDrawer`, `getStatus`, `printDailyReport` | Fiscal memory read, advanced fiscal config |
| UI | "Test Printer" button, real-time status in `FiscalTab` | Printer discovery/port scanning wizard |
| License | Honor existing `fiscal-printer` premium feature gate | Offline grace periods, new licensing model |

## Capabilities

### New Capabilities
- `fiscal-printer-plugin`: Plugin implementing `IPlugin` + `IFiscalPrinter` with per-brand adapters. Runs in main process. Depends on `escpos` (v3) and `serialport`.
- `fiscal-printer-ipc`: IPC handlers (`printer:test`, `printer:print-receipt`, `printer:status`, `printer:open-drawer`) that delegate to the plugin via `PluginLoader`, replacing current stubs.
- `fiscal-printer-ui`: `FiscalTab` enhancements — test button triggers `testConnection`, status indicator shows online/paper/drawer state.

### Modified Capabilities
None — all scaffolding is stub-only. No spec-level behavior changes.

## Approach

Single plugin per the existing `plugin-ve` pattern: one class implements `IPlugin`, a factory selects the correct adapter by `FiscalConfig.printerType`. Standard ESC/POS commands via `escpos`; brand-specific fiscal commands via `printer.raw()`.

```
IPC Handlers → PluginLoader.getInstance<FiscalPrinterPlugin>() → Factory → Adapter → escpos → serialport → HW
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `plugins/fiscal-printer/` | New | Plugin with adapters, factory, receipt formatter |
| `src/main/ipc/handlers.ts` | Modified | Replace stubs with plugin delegation |
| `src/main/preload.ts` | Modified | Add `getPrinterStatus` and `openDrawer` bridges |
| `src/renderer/settings/organisms/FiscalTab.tsx` | Modified | Add test button, status display |
| `plugin-api/src/contracts/IFiscalPrinter.ts` | Modified | Pass `FiscalConfig` to adapter constructor |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Brand-specific fiscal commands not in standard ESC/POS | High | Per-brand adapters with `printer.raw()` for proprietary bytes; manual testing per brand |
| Serial port permissions on Linux (`dialout` group) | Med | Document in installation guide |
| Native module rebuilds for Electron (`serialport`) | Low | Existing `postinstall` already handles `electron-builder install-app-deps` |
| Printer disconnection during operation | Med | Handle `error` events in adapters; surface status via IPC |

## Rollback Plan

Delete `plugins/fiscal-printer/` directory. Restore IPC handler stubs to `{ success: false, error: 'Not implemented' }`. Revert `FiscalTab` UI additions. No database migrations required (`FiscalConfig` schema is unchanged).

## Dependencies

- `escpos` ^3.0.0 (ESC/POS driver)
- `escpos-serialport` ^3.0.0 (serial adapter)
- `serialport` (native bindings, already in project via `postinstall` rebuild)
- `@sistema-facturacion/plugin-api` (workspace peer dep)

## Success Criteria

- [ ] Plugin activates with valid license and registers in `PluginLoader`
- [ ] `testConnection` returns success for each brand via serial port
- [ ] `printReceipt` outputs correct ESC/POS on physical printer
- [ ] `openDrawer` triggers cash drawer
- [ ] `getStatus` reports online/paper/drawer state accurately
- [ ] `printDailyReport` produces Z-report for fiscal compliance
- [ ] `FiscalTab` shows printer status and test button works end-to-end
- [ ] All adapters are unit-tested with mocked serial communication
