import { ContainerImpl } from './container-impl'
import type { Container } from './container-impl'

/**
 * ClientContainer — instancia de Container para uso en:
 * - Client Components ('use client')
 *
 * Solo tiene acceso a NEXT_PUBLIC_* env vars.
 * Usa browser client con anon key (RLS activo).
 * Las factories se registran en Unit 2 (Supabase Adapters).
 *
 * Uso:
 *   import { getClientContainer } from '@/core/client-container'
 *   const container = getClientContainer()
 *   const repo = container.resolve(TOKENS.SessionRepository)
 */

const clientContainer = new ContainerImpl()

export function getClientContainer(): Container {
  return clientContainer
}

/**
 * Registra todas las factories del ClientContainer.
 * Se llama una sola vez al mount del primer component.
 * Implementación en Unit 2 (Supabase Adapters).
 *
 * NOTA: No registra tokens que requieren service_role (admin operations).
 * Intentar resolver un token no registrado causa InternalError.
 */
export function registerClientDependencies(): void {
  // Skeleton — se llena en Unit 2 con:
  // clientContainer.register(TOKENS.SessionRepository, () => new SupabaseSessionRepository(browserClient))
  // clientContainer.register(TOKENS.AuthProvider, () => new SupabaseAuthProvider(browserClient))
  // etc.
}
