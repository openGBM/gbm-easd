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
  createBrowserSupabaseClient,
} from './adapters/supabase'

/**
 * ClientContainer — instancia de Container para uso en:
 * - Client Components ('use client')
 *
 * Solo tiene acceso a NEXT_PUBLIC_* env vars.
 * Usa browser client con anon key (RLS activo).
 *
 * Uso:
 *   import { getClientContainer } from '@/core/client-container'
 *   const container = getClientContainer()
 *   const repo = container.resolve(TOKENS.SessionRepository)
 */

const clientContainer = new ContainerImpl()
let registered = false

export function getClientContainer(): Container {
  if (!registered) {
    registerClientDependencies()
  }
  return clientContainer
}

/**
 * Registra todas las factories del ClientContainer.
 * Se ejecuta lazy al primer getClientContainer().
 *
 * NOTA: No registra tokens que requieren service_role (admin operations).
 * Usa browser client con anon key — RLS activo.
 */
export function registerClientDependencies(): void {
  if (registered) return
  registered = true

  const browserClient = createBrowserSupabaseClient()

  // Repositories disponibles en client (anon key, RLS activo)
  clientContainer.register(TOKENS.SessionRepository, () => new SupabaseSessionRepository(browserClient))
  clientContainer.register(TOKENS.RespondentRepository, () => new SupabaseRespondentRepository(browserClient))
  clientContainer.register(TOKENS.ResponseRepository, () => new SupabaseResponseRepository(browserClient))
  clientContainer.register(TOKENS.DimensionRepository, () => new SupabaseDimensionRepository(browserClient))
  clientContainer.register(TOKENS.QuestionRepository, () => new SupabaseQuestionRepository(browserClient))
  clientContainer.register(TOKENS.InstrumentRepository, () => new SupabaseInstrumentRepository(browserClient))
  clientContainer.register(TOKENS.ProfileRepository, () => new SupabaseProfileRepository(browserClient))
  clientContainer.register(TOKENS.TenantRepository, () => new SupabaseTenantRepository(browserClient))
  clientContainer.register(TOKENS.ViewerLinkRepository, () => new SupabaseViewerLinkRepository(browserClient))
  clientContainer.register(TOKENS.UsageLogRepository, () => new SupabaseUsageLogRepository(browserClient))
  clientContainer.register(TOKENS.AnalysisRepository, () => new SupabaseAnalysisRepository(browserClient))
}
