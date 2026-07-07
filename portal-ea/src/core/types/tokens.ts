/**
 * ServiceToken<T> — Token type-safe para resolver dependencias del Container.
 * Cada token es único y tipado: el Container retorna exactamente T.
 */
export class ServiceToken<T> {
  // Brand field para que dos ServiceToken<A> y ServiceToken<B> sean incompatibles
  // aunque A y B tengan la misma shape estructural
  private readonly _brand!: T

  constructor(readonly name: string) {}
}

// Importar las interfaces de ports (lazy — solo tipos, eliminados en compilación)
import type { SessionRepository } from '../ports/repositories/session.repository'
import type { RespondentRepository } from '../ports/repositories/respondent.repository'
import type { ResponseRepository } from '../ports/repositories/response.repository'
import type { DimensionRepository } from '../ports/repositories/dimension.repository'
import type { QuestionRepository } from '../ports/repositories/question.repository'
import type { InstrumentRepository } from '../ports/repositories/instrument.repository'
import type { ProfileRepository } from '../ports/repositories/profile.repository'
import type { TenantRepository } from '../ports/repositories/tenant.repository'
import type { ViewerLinkRepository } from '../ports/repositories/viewer-link.repository'
import type { UsageLogRepository } from '../ports/repositories/usage-log.repository'
import type { AnalysisRepository } from '../ports/repositories/analysis.repository'
import type { AuthProvider } from '../ports/auth/auth-provider'
import type { AuthGuard } from '../ports/auth/auth-guard'
import type { AuthMiddleware } from '../ports/auth/auth-middleware'
import type { AIProviderChain } from '../ports/ai/ai-provider-chain'
import type { Logger } from '../ports/observability/logger'
import type { MetricsCollector } from '../ports/observability/metrics'

/**
 * TOKENS — Single source of truth de todos los tokens del sistema.
 * Usado por consumers para resolver dependencias del Container.
 */
export const TOKENS = {
  // Repositories
  SessionRepository: new ServiceToken<SessionRepository>('SessionRepository'),
  RespondentRepository: new ServiceToken<RespondentRepository>('RespondentRepository'),
  ResponseRepository: new ServiceToken<ResponseRepository>('ResponseRepository'),
  DimensionRepository: new ServiceToken<DimensionRepository>('DimensionRepository'),
  QuestionRepository: new ServiceToken<QuestionRepository>('QuestionRepository'),
  InstrumentRepository: new ServiceToken<InstrumentRepository>('InstrumentRepository'),
  ProfileRepository: new ServiceToken<ProfileRepository>('ProfileRepository'),
  TenantRepository: new ServiceToken<TenantRepository>('TenantRepository'),
  ViewerLinkRepository: new ServiceToken<ViewerLinkRepository>('ViewerLinkRepository'),
  UsageLogRepository: new ServiceToken<UsageLogRepository>('UsageLogRepository'),
  AnalysisRepository: new ServiceToken<AnalysisRepository>('AnalysisRepository'),

  // Auth
  AuthProvider: new ServiceToken<AuthProvider>('AuthProvider'),
  AuthGuard: new ServiceToken<AuthGuard>('AuthGuard'),
  AuthMiddleware: new ServiceToken<AuthMiddleware>('AuthMiddleware'),

  // AI
  AIProviderChain: new ServiceToken<AIProviderChain>('AIProviderChain'),

  // Observability
  Logger: new ServiceToken<Logger>('Logger'),
  MetricsCollector: new ServiceToken<MetricsCollector>('MetricsCollector'),
} as const
