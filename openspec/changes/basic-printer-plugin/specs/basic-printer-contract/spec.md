# basic-printer-contract Specification

## Purpose

Define `IBasicPrinter` — a minimal printer contract for non-fiscal ESC/POS printing, reusable across built-in and third-party plugins. Reuses `ReceiptData`/`ReceiptLine` from `IFiscalPrinter` with zero type duplication.

## Requirements

| # | Requirement | Strength | Summary |
|---|------------|----------|---------|
| R1 | Contract methods | MUST | Expose `testConnection()`, `printReceipt()`, `getStatus()`, `openDrawer()` |
| R2 | Plugin identity | MUST | Expose `type: "basic-printer"` and `displayName: string` |
| R3 | ReceiptData reuse | MUST | `printReceipt(data: ReceiptData)` accepts existing receipt format unchanged |
| R4 | Free feature registration | MUST | `basic-printer` registered as free feature in `BUILT_IN_FEATURES` with `requiresLicense: false` |

### Requirement: Contract methods (R1)

`IBasicPrinter` MUST expose four async methods, each returning `Promise<PluginResult>`. It MUST NOT include `printInvoice`, `printDailyReport`, or `FiscalPrinterType`.

#### Scenario: All methods present

- GIVEN an object implementing `IBasicPrinter`
- WHEN its shape is inspected
- THEN `testConnection`, `printReceipt`, `getStatus`, and `openDrawer` are callable async methods
- AND `printInvoice` and `printDailyReport` are absent

#### Scenario: Basic printer rejects receipt with invoice data

- GIVEN a `ReceiptData` with `isInvoice: true`
- WHEN `printReceipt(data)` is called
- THEN the implementation MAY succeed (prints as ticket) or return `UNSUPPORTED_OPERATION`

### Requirement: Plugin identity (R2)

Every `IBasicPrinter` plugin MUST expose `type: "basic-printer"` and a descriptive `displayName: string`.

#### Scenario: Identity fields

- GIVEN a loaded basic printer plugin
- WHEN the kernel reads `plugin.type`
- THEN it equals `"basic-printer"`

### Requirement: ReceiptData reuse (R3)

`printReceipt` MUST accept the same `ReceiptData` type used by `IFiscalPrinter`, including `lines: ReceiptLine[]` with types `text|separator|item|total|barcode|subtotal|discount`.

#### Scenario: Same data passes through

- GIVEN a `ReceiptData` object built by `ReceiptConfirm`
- WHEN passed to either `IFiscalPrinter.printReceipt` or `IBasicPrinter.printReceipt`
- THEN both contracts accept the identical payload

### Requirement: Free feature registration (R4)

`BUILT_IN_FEATURES` in `plugin-api/src/license/types.ts` MUST include `basic-printer` with `requiresLicense: false`. `LicenseManager.isFeatureEnabled("basic-printer")` MUST return `{valid: true}` unconditionally.

#### Scenario: Feature always enabled

- GIVEN any license state (valid, expired, absent)
- WHEN `licenseManager.isFeatureEnabled("basic-printer")` is checked
- THEN it returns `{valid: true}`
