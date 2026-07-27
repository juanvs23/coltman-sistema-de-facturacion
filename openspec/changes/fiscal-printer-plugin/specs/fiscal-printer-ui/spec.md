# fiscal-printer-ui Specification

## Purpose

`FiscalTab` UI enhancements: connection test button with visual feedback, printer status display, and license-aware activation toggle.

## Requirements

| # | Requirement | Strength | Summary |
|---|------------|----------|---------|
| R1 | Connection test button | MUST | "Probar conexión" button triggers `testConnection()` and shows success/failure feedback |
| R2 | Status display | MUST | Visual indicator shows online/offline, paper status, and drawer state |
| R3 | License-gated toggle | MUST | `printerEnabled` toggle is disabled and shows license prompt when feature is not licensed |
| R4 | Test button disabled states | MUST | "Probar conexión" disabled when printer is not enabled or plugin is not available |
| R5 | Feedback messages | MUST | User-facing Spanish messages for connection results (success/failure with details) |

### Requirement: Connection test button (R1)

`FiscalTab` MUST render a "Probar conexión" button adjacent to the printer configuration section. When clicked, it MUST invoke `window.electronAPI.testPrinter()` and show a feedback indicator.

#### Scenario: Successful test

- GIVEN printer configured and connected
- WHEN user clicks "Probar conexión"
- THEN the button shows a loading spinner during the call
- AND on success, shows a green success message "Conexión exitosa"

#### Scenario: Failed test

- GIVEN printer configured but disconnected
- WHEN user clicks "Probar conexión"
- THEN on failure, shows a red error message with the reason (e.g. "Impresora no encontrada")

#### Scenario: Test button disabled when printer not enabled

- GIVEN `printerEnabled` is `false`
- WHEN the FiscalTab renders
- THEN "Probar conexión" button is disabled

### Requirement: Status display (R2)

`FiscalTab` MUST show the current printer status using `getPrinterStatus()`. The status indicator MUST display connectivity (online/offline), paper status, and cash drawer state.

#### Scenario: Printer online

- GIVEN printer connected and active
- WHEN status is fetched
- THEN indicator shows green "En línea" badge

#### Scenario: Paper out

- GIVEN printer online but paper depleted
- WHEN status is fetched
- THEN indicator shows amber "Sin papel" warning

#### Scenario: Drawer open

- GIVEN printer online and drawer open
- WHEN status is fetched
- THEN indicator shows "Cajón abierto" state

### Requirement: License-gated toggle (R3)

The `printerEnabled` toggle MUST be disabled when the `fiscal-printer` license is not valid. A tooltip or inline message MUST inform the user that a premium license is required.

#### Scenario: No license — toggle disabled

- GIVEN `fiscal-printer` feature is not licensed
- WHEN FiscalTab renders
- THEN the "Habilitar impresora fiscal" toggle is disabled
- AND a message reads "Requiere licencia premium"

#### Scenario: License valid — toggle enabled

- GIVEN `fiscal-printer` feature has a valid license
- WHEN FiscalTab renders
- THEN the enable toggle is functional

### Requirement: Test button disabled states (R4)

"Probar conexión" MUST be disabled when `printerEnabled` is `false` OR when the fiscal printer plugin is not available.

#### Scenario: Plugin not installed

- GIVEN fiscal printer plugin is not installed
- WHEN FiscalTab renders
- THEN "Probar conexión" is disabled

### Requirement: Feedback messages (R5)

All test results MUST display user-facing messages in Spanish. Success shows "Conexión exitosa". Errors show the reason: "Impresora no encontrada", "Sin papel", "Licencia requerida", "Plugin no disponible".

#### Scenario: License error during test

- GIVEN user clicks "Probar conexión" without a valid license
- WHEN the call returns `LICENSE_REQUIRED`
- THEN an error banner shows "Licencia requerida — active una licencia premium para usar esta función"

#### Scenario: Plugin not available error

- GIVEN user clicks "Probar conexión" but plugin is not active
- WHEN the call returns `PLUGIN_NOT_AVAILABLE`
- THEN an error banner shows "Plugin no disponible — instale el plugin de impresora fiscal"
