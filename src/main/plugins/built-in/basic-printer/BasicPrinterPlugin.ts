/**
 * BasicPrinterPlugin — built-in non-fiscal printer plugin.
 *
 * Connects via TCP to a thermal printer at localhost:9100 and sends
 * ESC/POS commands using the escpos library. Implements both IPlugin
 * (lifecycle: activate/deactivate) and IBasicPrinter (4 printer operations).
 *
 * Free tier — no license required. Does NOT support fiscal invoice printing.
 *
 * @packageDocumentation
 */
import net from 'net'
import { formatReceipt, formatDrawerKick } from './escpos-formatter'
import type { IPlugin } from '@plugin-api/contracts/IPlugin'
import type { IBasicPrinter } from '@plugin-api/contracts/IBasicPrinter'
import type { PluginManifest, PluginResult } from '@plugin-api/types'
import type { ReceiptData } from '@plugin-api/contracts/IFiscalPrinter'
import manifest from './plugin.json'

/** Default host for locally-attached thermal printers */
const DEFAULT_HOST = 'localhost'
/** Default port for ESC/POS-compatible thermal printers (raw TCP) */
const DEFAULT_PORT = 9100

/**
 * Built-in basic printer plugin.
 *
 * Connects to a TCP thermal printer at `localhost:9100` and sends
 * ESC/POS-formatted receipts. Does not require a license and does
 * not support fiscal invoice printing.
 */
export class BasicPrinterPlugin implements IPlugin, IBasicPrinter {
  /** Plugin manifest loaded from plugin.json */
  manifest = manifest as PluginManifest

  /** Printer type identifier (mirrors IFiscalPrinter.type convention) */
  readonly type = 'basic-printer'

  /** Human-readable printer name for UI display */
  readonly displayName = 'Basic Printer (ESC/POS)'

  private readonly host: string = DEFAULT_HOST
  private readonly port: number = DEFAULT_PORT

  /** Active TCP socket — set during activate, cleared on deactivate */
  private socket: net.Socket | null = null

  // ── IPlugin Lifecycle ─────────────────────────────────────

  /**
   * Activate the plugin: open a TCP connection to the printer.
   *
   * Called automatically when the plugin is loaded or toggled on.
   * Returns success only if the TCP connection was established.
   */
  async activate(): Promise<PluginResult> {
    try {
      await this.connect()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Printer connection failed'
      }
    }
  }

  /**
   * Deactivate the plugin: destroy the TCP socket and release resources.
   *
   * Called automatically when the plugin is toggled off or unloaded.
   * Idempotent — safe to call multiple times.
   */
  async deactivate(): Promise<PluginResult> {
    this.disconnect()
    return { success: true }
  }

  // ── IBasicPrinter Operations ──────────────────────────────

  /**
   * Test connectivity to the printer.
   *
   * Returns success if the socket is connected and writable.
   */
  async testConnection(): Promise<PluginResult> {
    try {
      const socket = this.ensureSocket()
      if (socket.destroyed) {
        return { success: false, error: 'Printer not connected' }
      }
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }

  /**
   * Print a receipt as ESC/POS bytes over the TCP socket.
   *
   * Formats the receipt using {@link formatReceipt} (pure function)
   * and writes the resulting buffer to the printer.
   */
  async printReceipt(data: ReceiptData): Promise<PluginResult> {
    try {
      const socket = this.ensureSocket()
      const buffer = formatReceipt(data)

      await new Promise<void>((resolve, reject) => {
        socket.write(buffer, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Print failed'
      }
    }
  }

  /**
   * Pulse the cash drawer.
   *
   * Sends the ESC/POS cash drawer kick command via {@link formatDrawerKick}.
   */
  async openDrawer(): Promise<PluginResult> {
    try {
      const socket = this.ensureSocket()
      const buffer = formatDrawerKick()

      await new Promise<void>((resolve, reject) => {
        socket.write(buffer, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Drawer open failed'
      }
    }
  }

  /**
   * Get the current printer status.
   *
   * Basic printers only report online/offline — they cannot detect
   * paper-out or drawer-open states directly.
   */
  async getStatus(): Promise<PluginResult<{
    online: boolean
    paperOut: boolean
    drawerOpen: boolean
  }>> {
    try {
      const connected = this.socket !== null && !this.socket.destroyed
      return {
        success: true,
        data: {
          online: connected,
          paperOut: false,
          drawerOpen: false
        }
      }
    } catch {
      return {
        success: false,
        error: 'Status check failed'
      }
    }
  }

  // ── Private: TCP Connection Management ────────────────────

  /**
   * Establish a TCP connection to the printer.
   *
   * Creates a new net.Socket and connects to `{host}:{port}`.
   * Rejects on connection error (printer offline, wrong port, etc.).
   */
  private connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const socket = new net.Socket()

      const onError = (err: Error): void => {
        socket.destroy()
        reject(err)
      }

      socket.once('error', onError)

      socket.connect(this.port, this.host, () => {
        // Connected successfully — remove error listener to
        // avoid unhandled rejections on future socket errors
        socket.removeListener('error', onError)

        // Listen for future errors (non-fatal — just log)
        socket.on('error', (err) => {
          console.error(`[BasicPrinterPlugin] Socket error: ${err.message}`)
        })

        this.socket = socket
        resolve()
      })
    })
  }

  /**
   * Disconnect from the printer and clean up the socket.
   *
   * Idempotent — safe to call when no socket exists.
   */
  private disconnect(): void {
    if (this.socket) {
      this.socket.destroy()
      this.socket = null
    }
  }

  /**
   * Return the active socket or throw if none is available.
   *
   * @throws Error if no socket is connected or the socket is destroyed
   */
  private ensureSocket(): net.Socket {
    if (!this.socket || this.socket.destroyed) {
      throw new Error('Printer not connected')
    }
    return this.socket
  }
}
