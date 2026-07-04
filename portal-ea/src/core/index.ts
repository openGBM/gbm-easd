// Core barrel export — punto de entrada principal de la capa de abstracción

// Errors & Result
export {
  DomainError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  RateLimitError,
  ServiceUnavailableError,
  InternalError,
  ok,
  err,
  isOk,
  isErr,
  map,
  flatMap,
} from './errors'
export type { Result, DomainErrorCode } from './errors'

// Types & Tokens
export { ServiceToken, TOKENS } from './types'
export type * from './types/dtos'

// Container
export type { Container } from './container-impl'
export { getServerContainer, registerServerDependencies } from './server-container'
export { getClientContainer, registerClientDependencies } from './client-container'

// Port interfaces (re-exported as types)
export type { SessionRepository } from './ports/repositories'
export type { RespondentRepository } from './ports/repositories'
export type { ResponseRepository } from './ports/repositories'
export type { DimensionRepository } from './ports/repositories'
export type { QuestionRepository } from './ports/repositories'
export type { InstrumentRepository } from './ports/repositories'
export type { ProfileRepository } from './ports/repositories'
export type { TenantRepository } from './ports/repositories'
export type { ViewerLinkRepository } from './ports/repositories'
export type { UsageLogRepository } from './ports/repositories'
export type { AnalysisRepository } from './ports/repositories'
export type { AuthProvider } from './ports/auth'
export type { AuthGuard } from './ports/auth'
export type { AuthMiddleware } from './ports/auth'
export type { AIProvider } from './ports/ai'
export type { AIProviderChain } from './ports/ai'
export type { Logger } from './ports/observability'
export type { MetricsCollector } from './ports/observability'
