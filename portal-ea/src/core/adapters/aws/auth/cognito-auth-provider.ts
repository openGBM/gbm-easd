// TODO: Replace with actual AWS SDK implementation
import type { AuthProvider } from '../../../ports/auth/auth-provider'
import type { AuthUser, AuthSession } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import type { DomainError } from '../../../errors/domain-errors'
import { err } from '../../../errors/result'
import { ServiceUnavailableError } from '../../../errors/domain-errors'

export class CognitoAuthProvider implements AuthProvider {
  signIn(_email: string, _password: string): Promise<Result<AuthUser, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  signOut(): Promise<Result<void, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  getUser(): Promise<Result<AuthUser | null, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  refreshSession(): Promise<Result<AuthSession, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  onAuthStateChange(_callback: (user: AuthUser | null) => void): () => void {
    return () => {}
  }
}
