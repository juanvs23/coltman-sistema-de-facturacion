# fiscal-printer-ipc Specification

## Purpose

IPC handlers that replace stubs with real delegation to the fiscal printer plugin via `AppKernel`, including license gating, error handling, and kernel module integration.

## Requirements

| # | Requirement | Strength | Summary |
|---|------------|----------|---------|
| R1 | Plugin detection | MUST | Handlers check if fiscal printer plugin is installed and active |
| R2 | License gating | MUST | Operations reject with `LICENSE_REQUIRED` if `isFeatureEnabled("fiscal-printer")` is invalid |
| R3 | Delegate to plugin | MUST | `printer:test`, `printer:print-receipt`, `printer:print-daily-report`, `printer:open-drawer` delegate to plugin instance |
| R4 | Error handling | MUST | Handlers catch and surface plugin errors as structured responses |
| R5 | Kernel exposure | MUST | `AppKernel` exposes `getFiscalPrinter()` mirroring `getCountryPlugin()` pattern |
| R6 | Preload bridge | MUST | New IPC channels (`getPrinterStatus`, `openDrawer`) exposed via `contextBridge` |

### Requirement: Plugin detection (R1)

IPC handlers MUST detect whether the `fiscal-printer` plugin is installed and active. When absent or inactive, handlers MUST return `{success: false, error: "PLUGIN_NOT_AVAILABLE"}`.

#### Scenario: Plugin not installed

- GIVEN no fiscal printer plugin in `plugins/`
- WHEN `printer:test` is invoked
- THEN returns `{success: false, error: "PLUGIN_NOT_AVAILABLE"}`

#### Scenario: Plugin installed but not active

- GIVEN fiscal printer plugin installed but deactivated
- WHEN `printer:print-receipt` is invoked
- THEN returns `{success: false, error: "PLUGIN_NOT_ACTIVE"}`

### Requirement: License gating (R2)

Before delegating, handlers MUST verify `licenseManager.isFeatureEnabled("fiscal-printer")`. If license is invalid, return `{success: false, error: "LICENSE_REQUIRED"}`.

#### Scenario: Valid license — operation proceeds

- GIVEN a valid premium license for `fiscal-printer`
- WHEN any printer IPC method is invoked
- THEN delegation to plugin proceeds

#### Scenario: No license — rejected

- GIVEN no license for `fiscal-printer`
- WHEN any printer IPC method is invoked
- THEN returns `{success: false, error: "LICENSE_REQUIRED"}`

### Requirement: Delegate to plugin (R3)

`printer:test` MUST delegate to `plugin.testConnection()`, `printer:print-receipt` to `plugin.printReceipt(data)`, `printer:print-daily-report` to `plugin.printDailyReport(totals)`, `printer:open-drawer` to `plugin.openDrawer()`.

#### Scenario: Handler delegates to plugin

- GIVEN an active fiscal printer plugin
- WHEN `printer:test` is invoked
- THEN `plugin.testConnection()` is called and its result is forwarded

#### Scenario: Receipt data forwarded

- GIVEN an active plugin
- WHEN `printer:print-receipt` is invoked with `ReceiptData`
- THEN `plugin.printReceipt(data)` receives the same data

### Requirement: Error handling (R4)

All printer handlers MUST catch plugin errors. Disconnection → `PRINTER_NOT_FOUND`, paper-out → `PAPER_OUT`, unknown → `PRINT_FAILED` with the original message.

#### Scenario: Printer disconnects mid-operation

- GIVEN printer disconnects during operation
- WHEN `printer:print-receipt` is invoked
- THEN returns `{success: false, error: "PRINTER_NOT_FOUND"}`

#### Scenario: Paper out

- GIVEN printer signals paper-out
- WHEN `printer:print-receipt` is invoked
- THEN returns `{success: false, error: "PAPER_OUT"}`

### Requirement: Kernel exposure (R5)

`AppKernel` MUST expose `getFiscalPrinter()` returning the active `IFiscalPrinter` instance or `null`. Resolution pattern MUST mirror `getCountryPlugin()`.

#### Scenario: Plugin active — kernel returns instance

- GIVEN a registered and activated fiscal printer plugin
- WHEN `kernel.getFiscalPrinter()` is called
- THEN it returns the `IFiscalPrinter` instance from the plugin

#### Scenario: No plugin — kernel returns null

- GIVEN no fiscal printer plugin registered
- WHEN `kernel.getFiscalPrinter()` is called
- THEN it returns `null`

### Requirement: Preload bridge (R6)

Preload MUST expose `getPrinterStatus()` (→ `printer:status`) and `openDrawer()` (→ `printer:open-drawer`) via `contextBridge`, alongside existing `testPrinter` and `printReceipt`.

#### Scenario: Renderer calls new IPC methods

- GIVEN preload bridge initialized
- WHEN renderer calls `window.electronAPI.getPrinterStatus()` or `openDrawer()`
- THEN the corresponding IPC channel is invoked and result returned
