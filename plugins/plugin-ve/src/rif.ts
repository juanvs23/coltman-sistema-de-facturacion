// ─── RIF Validation ──────────────────────────────────────────

const RIF_LETTER_VALUES: Record<string, number> = { V: 1, E: 2, J: 3, P: 4, G: 5 }
const WEIGHTS = [4, 3, 2, 7, 6, 5, 4, 3, 2]

const PERSON_TYPE_LABELS: Record<string, string> = {
  V: 'Venezolano',
  E: 'Extranjero',
  J: 'Jurídico',
  G: 'Gobierno',
  P: 'Pasaporte'
}

const PERSON_TYPE_DEFAULT_SUBTYPE: Record<string, string> = {
  V: 'contribuyente',
  E: 'contribuyente',
  J: 'contribuyente',
  G: 'gobierno',
  P: 'no_contribuyente'
}

/**
 * Valida un RIF venezolano.
 * Formato: [J|V|E|G|P]-XXXXXXXX-X
 * Retorna también el tipo de persona según el prefijo.
 */
export function validateRif(rif: string): {
  valid: boolean
  error?: string
  personType?: string
  personTypeLabel?: string
  personSubtype?: string
} {
  const clean = rif.trim().toUpperCase()

  if (!/^[JGVEP]-\d{8}-\d$/.test(clean)) {
    return { valid: false, error: 'Formato inválido. Debe ser: J-12345678-9' }
  }

  const letter = clean[0]
  const parts = clean.split('-')
  const digits = parts[1]
  const checkDigit = parseInt(parts[2], 10)

  const letterVal = RIF_LETTER_VALUES[letter]
  const nums = [letterVal, ...digits.split('').map(Number)]

  let sum = 0
  for (let i = 0; i < nums.length; i++) {
    sum += nums[i] * WEIGHTS[i]
  }

  const mod = sum % 11
  const calculated = mod === 0 ? 0 : mod === 1 ? 9 : 11 - mod

  if (calculated !== checkDigit) {
    return { valid: false, error: 'Dígito verificador inválido' }
  }

  return {
    valid: true,
    personType: letter,
    personTypeLabel: PERSON_TYPE_LABELS[letter] ?? 'Desconocido',
    personSubtype: PERSON_TYPE_DEFAULT_SUBTYPE[letter] ?? 'contribuyente'
  }
}

/**
 * Formatea un RIF a formato L-XXXXXXXX-X.
 */
export function formatRif(rif: string): string {
  const clean = rif.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (clean.length !== 10) return rif
  return `${clean[0]}-${clean.slice(1, 9)}-${clean.slice(9)}`
}

/**
 * Retorna la lista de tipos de persona disponibles para VE.
 */
export function getPersonTypes(): Array<{ value: string; label: string; subtypes: Array<{ value: string; label: string }> }> {
  return [
    { value: 'V', label: 'Natural Venezolano', subtypes: [
      { value: 'contribuyente', label: 'Contribuyente ordinario' },
      { value: 'no_contribuyente', label: 'No contribuyente' },
      { value: 'especial', label: 'Sujeto pasivo especial' },
      { value: 'independiente', label: 'Trabajador independiente' },
      { value: 'dependiente', label: 'Empleado / Dependiente' }
    ]},
    { value: 'E', label: 'Natural Extranjero', subtypes: [
      { value: 'contribuyente', label: 'Contribuyente ordinario' },
      { value: 'no_contribuyente', label: 'No contribuyente' },
      { value: 'independiente', label: 'Trabajador independiente' }
    ]},
    { value: 'J', label: 'Jurídico', subtypes: [
      { value: 'contribuyente', label: 'Contribuyente ordinario' },
      { value: 'especial', label: 'Sujeto pasivo especial' },
      { value: 'no_contribuyente', label: 'No contribuyente' }
    ]},
    { value: 'G', label: 'Gobierno', subtypes: [
      { value: 'gobierno', label: 'Ente gubernamental' }
    ]},
    { value: 'P', label: 'Pasaporte', subtypes: [
      { value: 'no_contribuyente', label: 'No contribuyente' }
    ]}
  ]
}
