import { InternalError } from './errors/domain-errors'
import { ServiceToken } from './types/tokens'

/**
 * Container interface — contrato para resolución de dependencias.
 */
export interface Container {
  resolve<T>(token: ServiceToken<T>): T
  register<T>(token: ServiceToken<T>, factory: () => T, scope?: 'singleton' | 'transient'): void
  isRegistered(token: ServiceToken<unknown>): boolean
}

/**
 * ContainerImpl — Service Locator ligero (~40 LOC).
 *
 * Características:
 * - Lazy instantiation (factory se ejecuta solo al primer resolve)
 * - Singleton caching
 * - Fail-fast si token no registrado (InternalError)
 * - Previene registro duplicado
 * - Zero dependencias externas
 */
export class ContainerImpl implements Container {
  private readonly factories = new Map<string, () => unknown>()
  private readonly singletons = new Map<string, unknown>()
  private readonly scopes = new Map<string, 'singleton' | 'transient'>()

  register<T>(
    token: ServiceToken<T>,
    factory: () => T,
    scope: 'singleton' | 'transient' = 'singleton',
  ): void {
    if (this.factories.has(token.name)) {
      throw new InternalError(
        `Token "${token.name}" ya registrado. ¿Registro duplicado accidental?`,
        { token: token.name },
      )
    }
    this.factories.set(token.name, factory)
    this.scopes.set(token.name, scope)
  }

  resolve<T>(token: ServiceToken<T>): T {
    const factory = this.factories.get(token.name)
    if (!factory) {
      throw new InternalError(
        `Token "${token.name}" no registrado. ¿Olvidaste registrarlo en el container?`,
        { token: token.name },
      )
    }

    const scope = this.scopes.get(token.name)!
    if (scope === 'singleton') {
      if (!this.singletons.has(token.name)) {
        this.singletons.set(token.name, factory())
      }
      return this.singletons.get(token.name) as T
    }

    return factory() as T
  }

  isRegistered(token: ServiceToken<unknown>): boolean {
    return this.factories.has(token.name)
  }
}
