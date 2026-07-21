import { describe, it, expect } from 'vitest'
import { validatePassword, AuthError } from '../guards'

describe('validatePassword', () => {
  it('returns null for a valid password meeting all criteria', () => {
    expect(validatePassword('Abc12345')).toBeNull()
    expect(validatePassword('Correcto1')).toBeNull()
    expect(validatePassword('XsL9qWrT')).toBeNull()
  })

  it('rejects passwords shorter than 8 characters', () => {
    const error = validatePassword('Ab1')
    expect(error).toContain('8 caracteres')
  })

  it('rejects passwords without uppercase letters', () => {
    const error = validatePassword('abcdefg1')
    expect(error).toContain('mayúscula')
  })

  it('rejects passwords without lowercase letters', () => {
    const error = validatePassword('ABCDEFG1')
    expect(error).toContain('minúscula')
  })

  it('rejects passwords without numbers', () => {
    const error = validatePassword('Abcdefgh')
    expect(error).toContain('número')
  })

  it('rejects exactly 7 characters even if all criteria met', () => {
    const error = validatePassword('Abcd1fg')
    expect(error).toContain('8 caracteres')
  })
})

describe('AuthError', () => {
  it('is an instance of Error', () => {
    const err = new AuthError('test error')
    expect(err).toBeInstanceOf(Error)
  })

  it('has name AuthError', () => {
    const err = new AuthError('test')
    expect(err.name).toBe('AuthError')
  })

  it('stores the message', () => {
    const err = new AuthError('permisos insuficientes')
    expect(err.message).toBe('permisos insuficientes')
  })
})

// guard() depends on Electron's IpcMainInvokeEvent and is tested
// through integration tests with a mocked IPC context.
