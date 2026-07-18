import type { PluginResult } from '../types'

/**
 * A fiscal document to send to SENIAT.
 */
export interface FiscalDocument {
  /** RIF of the issuer */
  issuerRif: string
  /** RIF of the recipient */
  recipientRif: string
  /** Recipient business name */
  recipientName: string
  /** Invoice number */
  invoiceNumber: string
  /** Control number (if applicable) */
  controlNumber?: string
  /** Generation date (ISO string) */
  date: string
  /** Subtotal before taxes */
  subtotal: number
  /** IVA amount (16%) */
  ivaAmount: number
  /** Total with taxes */
  total: number
  /** Encryption key required by SENIAT */
  encryptionKey: string
}

/**
 * SENIAT XML signing and submission result.
 */
export interface SeniatSubmissionResult {
  /** SENIAT-assigned receipt number */
  receiptNumber: string
  /** Encryption code (codigo de encriptacion) */
  encryptionCode: string
  /** Submission timestamp */
  submittedAt: string
  /** Raw XML that was sent */
  xmlContent: string
}

/**
 * Contract for the SENIAT electronic invoicing plugin.
 *
 * Handles XML generation, encryption, and submission
 * to Venezuela's tax authority.
 */
export interface ISeniat {
  /**
   * Generate the fiscal XML for a document.
   */
  generateXml(document: FiscalDocument): Promise<PluginResult<string>>

  /**
   * Sign and encrypt the XML per SENIAT specifications.
   */
  signXml(xmlContent: string, privateKey: string): Promise<PluginResult<string>>

  /**
   * Submit the signed XML to SENIAT.
   */
  submit(xmlContent: string): Promise<PluginResult<SeniatSubmissionResult>>

  /**
   * Validate a RIF number format.
   */
  validateRif(rif: string): Promise<PluginResult<boolean>>

  /**
   * Check if the SENIAT service is available.
   */
  healthCheck(): Promise<PluginResult<boolean>>
}
