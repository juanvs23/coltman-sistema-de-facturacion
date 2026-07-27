# fiscal-printer-contract Specification

## Purpose

Contract `IFiscalPrinter` that fiscal printer plugins MUST implement. Defines commands for receipt/invoice printing, cash drawer control, connection testing, status monitoring, and daily fiscal reports.

## Requirements

| # | Requirement | Strength | Summary |
|---|------------|----------|---------|
| R1 | Printer identity | MUST | Expose `type: FiscalPrinterType` and `displayName: string` |
| R2 | Connection test | MUST | `testConnection()` returns success when reachable, error otherwise |
| R3 | Receipt printing | MUST | `printReceipt(data: ReceiptData)` prints structured receipt |
| R4 | Invoice printing | MUST | `printInvoice(data: ReceiptData)` prints fiscal invoice with header/footer |
| R5 | Cash drawer | MUST | `openDrawer()` triggers cash drawer |
| R6 | Status monitoring | MUST | `getStatus()` returns `{online, paperOut, drawerOpen}` |
| R7 | Daily fiscal report | MAY | `printDailyReport(totals)` for Z-report |
| R8 | Error signaling | MUST | All commands return `PluginResult` with `success`, `error` code, and human-readable `message` |

### Requirement: Printer identity (R1)

The implementation MUST expose read-only `type` and `displayName` for identification.

### Requirement: Connection test (R2)

`testConnection()` MUST verify the printer is reachable and ready. On failure it MUST return a machine-readable error code.

#### Scenario: Connection success

- GIVEN a fiscal printer connected on configured port
- WHEN `testConnection()` is called
- THEN returns `{success: true}`

#### Scenario: Connection failure — printer not found

- GIVEN a configured port with no printer attached
- WHEN `testConnection()` is called
- THEN returns `{success: false, error: "PRINTER_NOT_FOUND", message: "..."}`

### Requirement: Receipt printing (R3)

`printReceipt(data)` MUST accept `ReceiptData` (header, lines, footer) and print to fiscal printer.

#### Scenario: Print receipt success

- GIVEN a connected printer
- WHEN `printReceipt({header: [...], lines: [...], footer: [...]})` is called
- THEN receipt prints and returns `{success: true}`

#### Scenario: Print receipt — paper out

- GIVEN a printer with paper-out status
- WHEN `printReceipt(data)` is called
- THEN returns `{success: false, error: "PAPER_OUT"}`

### Requirement: Invoice printing (R4)

`printInvoice(data)` MUST print invoices with fiscal header/footer distinct from receipt format.

#### Scenario: Print invoice

- GIVEN a connected fiscal printer
- WHEN `printInvoice(data)` is called with invoice ReceiptData
- THEN invoice prints with fiscal header and returns `{success: true}`

### Requirement: Cash drawer (R5)

`openDrawer()` MUST trigger the cash drawer solenoid if supported.

#### Scenario: Open drawer

- GIVEN a connected printer with cash drawer
- WHEN `openDrawer()` is called
- THEN drawer opens and returns `{success: true}`

### Requirement: Status monitoring (R6)

`getStatus()` MUST return live printer state with `online`, `paperOut`, and `drawerOpen` booleans.

#### Scenario: Check status online

- GIVEN a connected printer
- WHEN `getStatus()` is called
- THEN returns `{success: true, data: {online: true, paperOut: false, drawerOpen: false}}`

### Requirement: Daily fiscal report (R7)

`printDailyReport(totals)` MAY print a Z-report with `salesCount`, `totalAmount`, `taxTotal`.

#### Scenario: Print Z-report

- GIVEN a connected fiscal printer
- WHEN `printDailyReport({salesCount: 50, totalAmount: 5000, taxTotal: 800})` is called
- THEN Z-report prints and returns `{success: true}`

### Requirement: Error signaling (R8)

All commands MUST return `PluginResult<{success, error?, data?}>`. The `error` field MUST be a machine-readable code (e.g. `PRINTER_NOT_FOUND`, `PAPER_OUT`, `DRAWER_BLOCKED`). The `message` field MUST be a human-readable Spanish description.

#### Scenario: Unknown error during print

- GIVEN a printer that errors mid-print
- WHEN any print command is called
- THEN returns `{success: false, error: "PRINT_FAILED", message: "..."}`
