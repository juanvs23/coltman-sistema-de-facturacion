import escpos from 'escpos'
import type { ReceiptData, ReceiptLine } from '@plugin-api/contracts/IFiscalPrinter'

// escpos ships as CJS; destructure the Printer constructor
const Printer = escpos.Printer

/**
 * Creates an in-memory adapter that captures ESC/POS bytes into a Buffer.
 * Used instead of a network/USB adapter so formatReceipt remains a pure function.
 */
function createBufferAdapter(): {
  adapter: { open(cb: () => void): void; write(data: Buffer, cb: () => void): void; close(cb: () => void): void }
  getBuffer(): Buffer
} {
  const chunks: Buffer[] = []

  const adapter = {
    open(cb: () => void): void {
      if (cb) cb()
    },
    write(data: Buffer, cb: () => void): void {
      chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data))
      if (cb) cb()
    },
    close(cb: () => void): void {
      if (cb) cb()
    }
  }

  return {
    adapter,
    getBuffer(): Buffer {
      return Buffer.concat(chunks)
    }
  }
}

/**
 * Maps a ReceiptLine alignment to the escpos alignment constant.
 */
function escposAlign(align?: ReceiptLine['align']): string {
  switch (align) {
    case 'center':
      return 'CT'
    case 'right':
      return 'RT'
    case 'left':
    default:
      return 'LT'
  }
}

/**
 * Writes a single receipt line to the printer.
 * Barcode lines are no-ops for basic (non-fiscal) printers.
 */
function writeLine(printer: InstanceType<typeof Printer>, line: ReceiptLine): void {
  switch (line.type) {
    case 'text':
      printer.align(escposAlign(line.align))
      printer.text(line.text)
      printer.newLine()
      break
    case 'separator':
      printer.align('CT')
      printer.text(line.text)
      printer.newLine()
      break
    case 'item':
      printer.align(escposAlign(line.align))
      if (line.quantity !== undefined && line.price !== undefined) {
        printer.text(`${line.text}  x${line.quantity}  ${line.price.toFixed(2)}`)
      } else {
        printer.text(line.text)
      }
      printer.newLine()
      break
    case 'total':
      printer.align(escposAlign(line.align))
      printer.style('B') // bold
      printer.text(line.text)
      printer.style('NORMAL')
      printer.newLine()
      break
    case 'barcode':
      // No-op for basic printers: barcode printing is a fiscal requirement
      // that basic printers intentionally do NOT support (distinguishing feature)
      break
    default:
      // Unknown line type → treat as plain text to avoid data loss
      printer.text((line as ReceiptLine).text ?? '')
      printer.newLine()
  }
}

/**
 * Formats a complete receipt into ESC/POS byte commands.
 *
 * Pure function — takes receipt data, returns a Buffer of ESC/POS commands.
 * No side effects, no I/O, fully testable in isolation.
 *
 * @param data - Complete receipt data (header, lines, footer)
 * @returns Buffer containing ESC/POS commands ready for printer transmission
 */
export function formatReceipt(data: ReceiptData): Buffer {
  const { adapter, getBuffer } = createBufferAdapter()
  const printer = new Printer(adapter)

  // Header
  for (const line of data.header) {
    printer.align('CT')
    printer.text(line)
    printer.newLine()
  }

  if (data.header.length > 0) {
    printer.newLine()
  }

  // Lines
  for (const line of data.lines) {
    writeLine(printer, line)
  }

  // Footer
  if (data.footer.length > 0) {
    printer.newLine()
    for (const line of data.footer) {
      printer.align('CT')
      printer.text(line)
      printer.newLine()
    }
  }

  // Cut paper
  printer.cut()
  printer.close()

  return getBuffer()
}

/**
 * Generates ESC/POS command to open the cash drawer (pulse pin #2).
 *
 * Used by the BasicPrinterPlugin's openDrawer method. Extracted as a pure
 * function for testability — no need to mock TCP sockets to verify the
 * cash drawer pulse command bytes are correct.
 *
 * @returns Buffer containing the cash drawer kick command
 */
export function formatDrawerKick(): Buffer {
  const { adapter, getBuffer } = createBufferAdapter()
  const printer = new Printer(adapter)

  printer.cashdraw(2)
  printer.close()

  return getBuffer()
}
