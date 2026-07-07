import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuthProvider } from '../../../ports/auth/auth-provider'
import type { AuthUser, AuthSession } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import { ok, err } from '../../../errors/result'
import { UnauthorizedError, ServiceUnavailableError } from '../../../errors/domain-errors'
import type { DomainError } from '../../../errors/domain-errors'

/**
 * SupabaseAuthProvider — Implementa AuthProvider usando Supabase Auth (GoTrue).
 *
 * Soporta tanto browser client (client components) como server client (SSR con cookies).
 */
export class SupabaseAuthProvider implements AuthProvider {
  constructor(private readonly client: SupabaseClient) {}

  async signIn(email: string, password: string): Promise<Result<AuthUser, DomainError>> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      return err(new UnauthorizedError('Credenciales inválidas'))
    }

    return ok({
      id: data.user.id,
      email: data.user.email || '',
    })
  }

  async signOut(): Promise<Result<void, DomainError>> {
    const { error } = await this.client.auth.signOut()

    if (error) {
      return err(new ServiceUnavailableError('Error al cerrar sesión'))
    }

    return ok(undefined)
  }

  async getUser(): Promise<Result<AuthUser | null, DomainError>> {
    const { data: { user }, error } = await this.client.auth.getUser()

    if (error || !user) {
      return ok(null)
    }

    return ok({
      id: user.id,
      email: user.email || '',
    })
  }

  async refreshSession(): Promise<Result<AuthSession, DomainError>> {
    const { data, error } = await this.client.auth.refreshSession()

    if (error || !data.session) {
      return err(new UnauthorizedError('No se pudo refrescar la sesión'))
    }

    return ok({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: new Date((data.session.expires_at || 0) * 1000).toISOString(),
    })
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    const { data: { subscription } } = this.client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback({ id: session.user.id, email: session.user.email || '' })
      } else {
        callback(null)
      }
    })

    return () => subscription.unsubscribe()
  }
}
