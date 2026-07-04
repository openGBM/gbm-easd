import { ContainerImpl } from './container-impl'
import type { Container } from './container-impl'

/**
 * ServerContainer — instancia de Container para uso en:
 * - Server Components
 * - API Routes
 * - Middleware (proxy.ts)
 *
 * Tiene acceso a env vars server-side y puede usar service_role key.
 * Las factories se registran en Unit 2 (Supabase Adapters).
 *
 * Uso:
 *   import { getServerContainer } from '@/core/server-container'
 *   const container = getServerContainer()
 *   const repo = container.resolve(TOKENS.SessionRepository)
 */

const serverContainer = new ContainerImpl()

export function getServerContainer(): Container {
  return serverContainer
}

/**
 * Registra todas las factories del ServerContainer.
 * Se llama una sola vez al boot de la aplicación.
 * Implementación en Unit 2 (Supabase Adapters).
 */
export function registerServerDependencies(): void {
  // Skeleton — se llena en Unit 2 con:
  // serverContainer.register(TOKENS.SessionRepository, () => new SupabaseSessionRepository(...))
  // serverContainer.register(TOKENS.AuthProvider, () => new SupabaseAuthProvider(...))
  // etc.
}
