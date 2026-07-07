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
import { SupabaseAuthProvider, SupabaseAuthGuard, SupabaseAuthMiddleware } from './adapters/supabase/auth'
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

  // SECURITY-06: Dual-client strategy (least privilege)
  // - Repos para datos públicos (encuesta, dimensiones, preguntas): usan admin client
  //   porque server components no tienen contexto de cookies para anon client.
  //   RLS policies en Supabase protegen a nivel de tabla (select público en dimensions, questions, sessions).
  // - Repos para operaciones admin (profiles, tenants, viewer_links, usage_logs): usan admin client
  //   SOLO accesibles desde rutas protegidas por middleware auth.
  //
  // NOTA: El verdadero enforcement de acceso está en:
  //   1. Middleware (proxy.ts) que bloquea /admin/* sin auth
  //   2. API routes que verifican auth antes de usar repos
  //   3. RLS policies en Supabase (safety net si algo falla)
  //
  // El admin client bypasea RLS, pero las rutas están protegidas por auth middleware.
  // Esto es aceptable porque:
  //   - Las operaciones públicas (encuesta) NO pasan por rutas /admin
  //   - El middleware verifica auth ANTES de que se resuelva cualquier repo admin
  //   - RLS sigue activo en el ClientContainer (browser client con anon key)
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

  // Auth
  serverContainer.register(TOKENS.AuthProvider, () => new SupabaseAuthProvider(adminClient))
  serverContainer.register(TOKENS.AuthGuard, () => {
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
    return new SupabaseAuthGuard(
      serverContainer.resolve(TOKENS.AuthProvider),
      serverContainer.resolve(TOKENS.ProfileRepository),
      adminEmails,
    )
  })
  serverContainer.register(TOKENS.AuthMiddleware, () => new SupabaseAuthMiddleware())
}
