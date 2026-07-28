# basic-printer-plugin Specification

## Purpose

Built-in ESC/POS plugin at `src/main/plugins/built-in/basic-printer/` implementing `IBasicPrinter` via TCP connection. No license check, no native dependencies.

## Requirements

| # | Requirement | Strength | Summary |
|---|------------|----------|---------|
| R1 | Plugin manifest | MUST | `plugin.json` with `id: "basic-printer"`, `requiresLicense: false`, type `built-in` |
| R2 | TCP connection | MUST | Connect via `net.Socket` to configurable host:port (default `localhost:9100`) |
| R3 | ESC/POS formatting | MUST | Transform `ReceiptData` → ESC/POS bytes using `escpos` or raw buffer writes |
| R4 | Disconnect resilience | MUST | Auto-reconnect on write failure; surface `PRINTER_NOT_FOUND` if unreachable |
| R5 | Plugin lifecycle | MUST | Implement `IPlugin`: `activate()`, `deactivate()`, expose `IBasicPrinter` on activation |

### Requirement: Plugin manifest (R1)

The plugin directory MUST contain a `plugin.json` with `id: "basic-printer"`, `type: "built-in"`, `requiresLicense: false`, and an `exports` block pointing to the plugin entry.

#### Scenario: Manifest declares free plugin

- GIVEN the plugin is loaded from `built-in/basic-printer/`
- WHEN `PluginLoader` reads `plugin.json`
- THEN `requiresLicense` is `false` and `id` equals `"basic-printer"`

### Requirement: TCP connection (R2)

The plugin MUST open a TCP connection to `host:port`. Default MUST be `localhost:9100`. Connection MUST be established during `activate()` and closed during `deactivate()`.

#### Scenario: Connect to default port

- GIVEN an escpos-emulator listening on `localhost:9100`
- WHEN `activate()` is called
- THEN a TCP socket connects successfully and `isConnected` returns true

#### Scenario: Connection refused

- GIVEN no printer listening on the configured port
- WHEN `activate()` is called
- THEN `isConnected` returns false and subsequent operations return `PRINTER_NOT_FOUND`

### Requirement: ESC/POS formatting (R3)

`printReceipt` MUST convert `ReceiptData` fields (`header`, `lines`, `footer`, `customerInfo`) into valid ESC/POS commands. `barcode` lines SHOULD be rendered as a no-op (no error, no output). `openDrawer` MUST send the drawer kick pulse command.

#### Scenario: Print ticket with items

- GIVEN a `ReceiptData` with header, 2 items, subtotal, total, and footer
- WHEN `printReceipt(data)` is called
- THEN valid ESC/POS bytes are written to the TCP socket

#### Scenario: Open cash drawer

- GIVEN a connected basic printer
- WHEN `openDrawer()` is called
- THEN the drawer kick pulse ESC/POS command is sent

### Requirement: Disconnect resilience (R4)

If the TCP socket disconnects during an operation, the plugin MUST attempt a single reconnect. If reconnect fails, it MUST return `PRINTER_NOT_FOUND`.

#### Scenario: Printer disconnects mid-print

- GIVEN TCP connection drops during `printReceipt`
- WHEN the write fails
- THEN the plugin attempts one reconnect and retries
- AND returns `PRINTER_NOT_FOUND` if reconnection fails

### Requirement: Plugin lifecycle (R5)

The plugin MUST implement `IPlugin`. `activate()` MUST register the `IBasicPrinter` instance with the kernel. `deactivate()` MUST close the TCP connection and unregister.

#### Scenario: Full lifecycle

- GIVEN a basic printer plugin loaded by `PluginLoader`
- WHEN `activate(kernel)` is called
- THEN a TCP connection opens and the instance is registered via `kernel.registerBasicPrinter()`
- WHEN `deactivate()` is called
- THEN the TCP socket closes and the instance unregisters
