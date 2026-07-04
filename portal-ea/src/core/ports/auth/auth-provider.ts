import type { Result } from '../../errors'
import type { DomainError } from '../../errors'
import type { AuthUser, AuthSession } from '../../types/dtos'

export interface AuthProvider {
  signIn(email: string, password: string): Promise<Result<AuthUser, DomainError>>
  signOut(): Promise<Result<void, DomainError>>
  getUser(): Promise<Result<AuthUser | null, DomainError>>
  refreshSession(): Promise<Result<AuthSession, DomainError>>
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void
}
