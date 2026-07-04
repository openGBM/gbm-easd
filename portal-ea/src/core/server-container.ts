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
import { GeminiProvider, GroqProvider, DefaultAIProviderChain } from './adapters/ai'
import { PinoLogger, InMemoryMetricsCollector } from './observability'

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

  // Repositories — usan admin client para operaciones que requieren bypass RLS
  // NOTA sobre RNF-ABS-04: Idealmente se usaría server client (anon + cookies)
  // para operaciones públicas y admin solo para operaciones privilegiadas.
  // En esta implementación inicial usamos admin para simplificar (el middleware
  // ya verifica auth antes de que se llegue a los repos en rutas protegidas).
  // Para la encuesta pública, RLS protege vía policies (insert público, select restringido).
  // 
  // TODO (Unit 4.5): Implementar dual-client strategy:
  //   - Repos públicos: anon client con cookie auth context
  //   - Repos admin: service_role client
  const adminClient = createAdminSupabaseClient()
  if (!adminClient) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')

  serverContainer.register(TOKENS.SessionRepository, () => new SupabaseSessionRepository(adminClient))
  serverContainer.register(TOKENS.RespondentRepository, () => new SupabaseRespondentRepository(adminClient))
  serverContainer.register(TOKENS.ResponseRepository, () => new SupabaseResponseRepository(adminClient))
  serverContainer.register(TOKENS.DimensionRepository, () => new SupabaseDimensionRepository(adminClient))
  serverContainer.register(TOKENS.QuestionRepository, () => new SupabaseQuestionRepository(adminClient))
  serverContainer.register(TOKENS.InstrumentRepository, () => new SupabaseInstrumentRepository(adminClient))
  serverContainer.register(TOKENS.ProfileRepository, () => new SupabaseProfileRepository(adminClient))
  serverContainer.register(TOKENS.TenantRepository, () => new SupabaseTenantRepository(adminClient))
  serverContainer.register(TOKENS.ViewerLinkRepository, () => new SupabaseViewerLinkRepository(adminClient))
  serverContainer.register(TOKENS.UsageLogRepository, () => new SupabaseUsageLogRepository(adminClient))
  serverContainer.register(TOKENS.AnalysisRepository, () => new SupabaseAnalysisRepository(adminClient))

  // AI Provider Chain — failover configurable vía AI_PROVIDERS env var
  serverContainer.register(TOKENS.AIProviderChain, () => {
    const providersConfig = (process.env.AI_PROVIDERS || 'gemini,groq').split(',').map(s => s.trim())
    const providers: import('./ports/ai/ai-provider').AIProvider[] = []

    for (const name of providersConfig) {
      if (name === 'gemini' && process.env.GEMINI_API_KEY) {
        providers.push(new GeminiProvider(process.env.GEMINI_API_KEY))
      } else if (name === 'groq' && process.env.GROQ_API_KEY) {
        providers.push(new GroqProvider(process.env.GROQ_API_KEY))
      }
    }

    return new DefaultAIProviderChain(providers)
  })

  // Observability
  serverContainer.register(TOKENS.Logger, () => new PinoLogger({ component: 'server' }))
  serverContainer.register(TOKENS.MetricsCollector, () => new InMemoryMetricsCollector())
}
