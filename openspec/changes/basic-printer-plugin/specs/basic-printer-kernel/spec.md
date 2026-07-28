# basic-printer-kernel Specification

## Purpose

Extend `AppKernel` with basic printer slots (mirroring fiscal pattern), add `PluginLoader` duck-typing detection, and modify IPC printer handlers with a fallback chain: fiscal (licensed) → basic (free) → `PLUGIN_NOT_AVAILABLE`. The basic path MUST NOT check the license.

## Requirements

| # | Requirement | Strength | Summary |
|---|------------|----------|---------|
| R1 | Kernel slots | MUST | `registerBasicPrinter()`, `getBasicPrinter()`, `hasBasicPrinter()`, `unregisterBasicPrinter()` |
| R2 | Duck-typing detection | MUST | `isBasicPrinterPlugin()`: has `printReceipt` + `testConnection`, lacks `printInvoice` |
| R3 | PluginLoader integration | MUST | After plugin activation, call `tryRegisterBasicPrinter()` via duck-typing |
| R4 | IPC fiscal priority | MUST | Fiscal path checked first; only falls to basic if fiscal unavailable or license invalid |
| R5 | IPC basic path | MUST | Basic printer operations skip `checkFiscalLicense()` entirely |
| R6 | IPC error fallback | MUST | If neither fiscal nor basic available, return `PLUGIN_NOT_AVAILABLE` |

### Requirement: Kernel slots (R1)

`AppKernel` MUST expose four new methods mirroring the fiscal printer pattern: `registerBasicPrinter(pluginId: string)`, `registerBasicPrinterInstance(pluginId, instance)`, `getBasicPrinter() → IBasicPrinter | null`, `hasBasicPrinter() → boolean`.

#### Scenario: Register and retrieve basic printer

- GIVEN a basic printer plugin with id `"basic-printer"`
- WHEN `kernel.registerBasicPrinter("basic-printer")` and then `kernel.getBasicPrinter()` is called
- THEN it returns the registered `IBasicPrinter` instance

#### Scenario: No basic printer registered

- GIVEN no basic printer plugin registered
- WHEN `kernel.hasBasicPrinter()` is called
- THEN it returns `false`

### Requirement: Duck-typing detection (R2)

`isBasicPrinterPlugin(plugin)` MUST return `true` when the plugin instance has `printReceipt`, `testConnection`, and `openDrawer` as functions AND does NOT have `printInvoice`. Otherwise returns `false`.

#### Scenario: Basic printer detected

- GIVEN a plugin instance with `printReceipt`, `testConnection`, `openDrawer` (no `printInvoice`)
- WHEN `isBasicPrinterPlugin(instance)` is called
- THEN returns `true`

#### Scenario: Fiscal printer not misdetected

- GIVEN a plugin with both `printReceipt` and `printInvoice` (a fiscal printer)
- WHEN `isBasicPrinterPlugin(instance)` is called
- THEN returns `false`

### Requirement: PluginLoader integration (R3)

`PluginLoader` MUST, after a plugin activates, call `tryRegisterBasicPrinter()` which checks `isBasicPrinterPlugin()` and, if true, registers the instance via `kernel.registerBasicPrinterInstance()`.

#### Scenario: PluginLoader auto-detects basic printer

- GIVEN a plugin implementing `IBasicPrinter` is loaded and activated
- WHEN `PluginLoader` finishes activation
- THEN `kernel.hasBasicPrinter()` returns `true`

### Requirement: IPC fiscal priority (R4)

Printer IPC handlers (`printer:test`, `printer:print-receipt`, `printer:open-drawer`) MUST first attempt the fiscal printer path. Fiscal path checks license via `checkFiscalLicense()`. If license is valid AND fiscal plugin is active, delegate to `IFiscalPrinter` and return its result.

#### Scenario: Fiscal licensed — uses fiscal

- GIVEN a valid fiscal license and active fiscal printer plugin
- WHEN `printer:test` is invoked
- THEN the handler delegates to `IFiscalPrinter.testConnection()` via the fiscal path

### Requirement: IPC basic path (R5)

If the fiscal path is unavailable (no plugin OR license invalid), handlers MUST fall back to `kernel.getBasicPrinter()`. The basic path MUST NOT call `checkFiscalLicense()` — it delegates directly to `IBasicPrinter`.

#### Scenario: No fiscal plugin — falls to basic

- GIVEN no fiscal plugin registered, but a basic printer is active
- WHEN `printer:print-receipt` is invoked with valid `ReceiptData`
- THEN `IBasicPrinter.printReceipt(data)` is called without any license check
- AND the result is returned to the renderer

#### Scenario: Unlicensed fiscal — falls to basic

- GIVEN fiscal plugin registered but license is invalid, and basic printer is active
- WHEN `printer:open-drawer` is invoked
- THEN the handler skips the fiscal path and delegates to `IBasicPrinter.openDrawer()`

### Requirement: IPC error fallback (R6)

If neither fiscal nor basic printer is available, handlers MUST return `{success: false, error: "PLUGIN_NOT_AVAILABLE"}`.

#### Scenario: No printer at all

- GIVEN no fiscal plugin and no basic printer registered
- WHEN any printer IPC method is invoked
- THEN returns `{success: false, error: "PLUGIN_NOT_AVAILABLE"}`

#### Scenario: TCP disconnect on basic path

- GIVEN basic printer connected but TCP socket drops
- WHEN `printer:print-receipt` is invoked
- THEN the handler surfaces `PRINTER_NOT_FOUND` from the plugin
