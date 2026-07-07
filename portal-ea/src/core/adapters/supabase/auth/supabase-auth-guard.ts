import type { AuthGuard } from '../../../ports/auth/auth-guard'
import type { AuthProvider } from '../../../ports/auth/auth-provider'
import type { ProfileRepository } from '../../../ports/repositories/profile.repository'
import type { Profile, UserRole } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import type { DomainError } from '../../../errors/domain-errors'
import { ok, isOk } from '../../../errors/result'

/**
 * SupabaseAuthGuard — Verificación de roles y permisos.
 *
 * Combina AuthProvider (para obtener el usuario actual) con ProfileRepository
 * (para obtener el perfil con rol y tenant).
 */
export class SupabaseAuthGuard implements AuthGuard {
  private readonly roleHierarchy: UserRole[] = ['editor', 'admin', 'super_admin']

  constructor(
    private readonly authProvider: AuthProvider,
    private readonly profileRepo: ProfileRepository,
    private readonly adminEmails: string[],
  ) {}

  async isAuthenticated(): Promise<boolean> {
    const userResult = await this.authProvider.getUser()
    return isOk(userResult) && userResult.value !== null
  }

  async getCurrentProfile(): Promise<Result<Profile | null, DomainError>> {
    const userResult = await this.authProvider.getUser()
    if (!isOk(userResult) || !userResult.value) {
      return ok(null)
    }

    const profileResult = await this.profileRepo.findById(userResult.value.id)
    if (!isOk(profileResult)) {
      // No tiene perfil en la tabla — verificar si es admin legacy
      if (this.adminEmails.includes(userResult.value.email)) {
        return ok({
          id: userResult.value.id,
          email: userResult.value.email,
          role: 'admin' as UserRole,
          tenantId: null,
          isActive: true,
          displayName: null,
        })
      }
      return ok(null)
    }

    return ok(profileResult.value)
  }

  async hasRole(requiredRole: UserRole): Promise<boolean> {
    const profileResult = await this.getCurrentProfile()
    if (!isOk(profileResult) || !profileResult.value) return false

    return this.hasMinRole(profileResult.value.role, requiredRole)
  }

  hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean {
    return this.roleHierarchy.indexOf(userRole) >= this.roleHierarchy.indexOf(requiredRole)
  }

  isAdminEmail(email: string): boolean {
    return this.adminEmails.includes(email)
  }
}
