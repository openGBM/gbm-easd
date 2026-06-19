import { describe, it, expect } from 'vitest'

// Simular la lógica de validación de tokens (misma que usa el API)
function createToken(sessionId: string, expiresInHours: number): { token: string; expiresAt: string } {
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
  const payload = { session_id: sessionId, expires_at: expiresAt, created_by: 'test@gbm.net' }
  const token = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return { token, expiresAt }
}

function decodeToken(token: string): { session_id: string; expires_at: string; created_by: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

describe('Viewer Link Token', () => {
  it('genera un token base64url válido', () => {
    const { token } = createToken('123e4567-e89b-12d3-a456-426614174000', 72)
    expect(token).toBeTruthy()
    expect(token.length).toBeGreaterThan(10)
    // No debe contener caracteres que rompan URLs
    expect(token).not.toMatch(/[+/=]/)
  })

  it('decodifica correctamente el token', () => {
    const sessionId = '123e4567-e89b-12d3-a456-426614174000'
    const { token } = createToken(sessionId, 72)
    const decoded = decodeToken(token)
    expect(decoded).not.toBeNull()
    expect(decoded!.session_id).toBe(sessionId)
    expect(decoded!.created_by).toBe('test@gbm.net')
  })

  it('token no expirado retorna false', () => {
    const { expiresAt } = createToken('test-id', 72)
    expect(isTokenExpired(expiresAt)).toBe(false)
  })

  it('token expirado retorna true', () => {
    const pastDate = new Date(Date.now() - 1000).toISOString()
    expect(isTokenExpired(pastDate)).toBe(true)
  })

  it('token con 0 horas ya está expirado', () => {
    const expiresAt = new Date(Date.now() - 60000).toISOString()
    expect(isTokenExpired(expiresAt)).toBe(true)
  })

  it('token inválido no se decodifica', () => {
    expect(decodeToken('not-a-valid-token!!!')).toBeNull()
    expect(decodeToken('')).toBeNull()
  })
})
