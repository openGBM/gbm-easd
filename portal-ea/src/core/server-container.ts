import { ContainerImpl } from './container-impl'
import type { Container } from './container-impl'
import { TOKENS } from './types/tokens'
import {
  SupabaseSessionRepository,
  SupabaseRespondentRepository,
  SupabaseResponseRepository,
  SupabaseDimensionRepository,
  SupabaseQuestionRepository,
  SupabaseInstrumentRepository,
  SupabaseProfileRepository,
  SupabaseTenantRepository,
  SupabaseViewerLinkRepository,
  SupabaseUsageLogRepository,
  SupabaseAnalysisRepository,
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from './adapters/supabase'

/**
 * ServerContainer — instancia de Container para uso en:
 * - Server Components
 * - API Routes
 * - Middleware (proxy.ts)
 *
 * Tiene acceso a env vars server-side y puede usar service_role key.
 *
 * Uso:
 *   import { getServerContainer } from '@/core/server-container'
 *   const container = getServerContainer()
 *   const repo = container.resolve(TOKENS.SessionRepository)
 */

const serverContainer = new ContainerImpl()
let registered = false

export function getServerContainer(): Container {
  if (!registered) {
    registerServerDependencies()
  }
  return serverContainer
}

/**
 * Registra todas las factories del ServerContainer.
 * Se ejecuta lazy al primer getServerContainer().
 */
export function registerServerDependencies(): void {
  if (registered) return
  registered = true

  // Repositories — usan createServerSupabaseClient (async, lazy per-request)
  // Para server components y API routes, creamos el client en cada resolve
  // porque el client depende de cookies del request actual

  serverContainer.register(TOKENS.SessionRepository, () => {
    // NOTA: Este patrón requiere que el consumer haga await del client antes.
    // Para simplificar, usamos un proxy que crea el client on-demand.
    // En la práctica, los API routes llaman createServerSupabaseClient() y pasan el client.
    // Aquí registramos una factory que usa admin client (disponible sin cookies).
    const adminClient = createAdminSupabaseClient()
    if (!adminClient) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
    return new SupabaseSessionRepository(adminClient)
  })

  serverContainer.register(TOKENS.RespondentRepository, () => {
    const adminClient = createAdminSupabaseClient()
    if (!adminClient) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
    return new SupabaseRespondentRepository(adminClient)
  })

  serverContainer.register(TOKENS.ResponseRepository, () => {
    const adminClient = createAdminSupabaseClient()
    if (!adminClient) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
    return new SupabaseResponseRepository(adminClient)
  })

  serverContainer.register(TOKENS.DimensionRepository, () => {
    const adminClient = createAdminSupabaseClient()
    if (!adminClient) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
    return new SupabaseDimensionRepository(adminClient)
  })

  serverContainer.register(TOKENS.QuestionRepository, () => {
    const adminClient = createAdminSupabaseClient()
    if (!adminClient) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
    return new SupabaseQuestionRepository(adminClient)
  })

  serverContainer.register(TOKENS.InstrumentRepository, () => {
    const adminClient = createAdminSupabaseClient()
    if (!adminClient) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
    return new SupabaseInstrumentRepository(adminClient)
  })

  serverContainer.register(TOKENS.ProfileRepository, () => {
    const adminClient = createAdminSupabaseClient()
    if (!adminClient) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
    return new SupabaseProfileRepository(adminClient)
  })

  serverContainer.register(TOKENS.TenantRepository, () => {
    const adminClient = createAdminSupabaseClient()
    if (!adminClient) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
    return new SupabaseTenantRepository(adminClient)
  })

  serverContainer.register(TOKENS.ViewerLinkRepository, () => {
    const adminClient = createAdminSupabaseClient()
    if (!adminClient) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
    return new SupabaseViewerLinkRepository(adminClient)
  })

  serverContainer.register(TOKENS.UsageLogRepository, () => {
    const adminClient = createAdminSupabaseClient()
    if (!adminClient) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
    return new SupabaseUsageLogRepository(adminClient)
  })

  serverContainer.register(TOKENS.AnalysisRepository, () => {
    const adminClient = createAdminSupabaseClient()
    if (!adminClient) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
    return new SupabaseAnalysisRepository(adminClient)
  })
}
