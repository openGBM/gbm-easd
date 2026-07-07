import type { Result } from '../../errors'
import type { DomainError } from '../../errors'
import type { Profile, UserRole } from '../../types/dtos'

export interface AuthGuard {
  isAuthenticated(): Promise<boolean>
  getCurrentProfile(): Promise<Result<Profile | null, DomainError>>
  hasRole(requiredRole: UserRole): Promise<boolean>
  hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean
  isAdminEmail(email: string): boolean
}
