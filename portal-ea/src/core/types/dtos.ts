/**
 * Data Transfer Objects — Definen la forma de datos de entrada para cada operación.
 * Los DTOs definen la shape; la validación (Zod) ocurre en la capa API.
 */

// ─── Session ────────────────────────────────────────────────────────────────

export interface CreateSessionDTO {
  name: string
  isActive?: boolean
  tenantId?: string | null
  instrumentVersionId?: string | null
}

export interface UpdateSessionDTO {
  name?: string
  isActive?: boolean
}

export interface SessionFilters {
  tenantId?: string
  isActive?: boolean
  search?: string
  instrumentId?: string
}

// ─── Respondent ─────────────────────────────────────────────────────────────

export interface CreateRespondentDTO {
  sessionId: string
  name: string
  email: string
}

// ─── Response ───────────────────────────────────────────────────────────────

export interface CreateResponseDTO {
  questionId: string
  value: number | null // null para respuestas solo-texto
  textValue?: string | null
}

// ─── Instrument ─────────────────────────────────────────────────────────────

export interface CreateInstrumentDTO {
  name: string
  description?: string | null
  aiExpertisePrompt?: string | null
}

export interface CreateVersionDTO {
  instrumentId: string
  versionNumber: number
  versionTag?: string
  isCurrent?: boolean
  isActive?: boolean
  scaleLabels?: unknown | null
  maturityLevels?: unknown | null
}

export interface CreateDimensionDTO {
  name: string
  description: string
  color: string
  displayOrder: number
  instrumentVersionId: string
}

export interface CreateQuestionDTO {
  dimensionId: string
  text: string
  displayOrder: number
  type?: string
  isRequired?: boolean
  contributesToScore?: boolean
}

// ─── Profile ────────────────────────────────────────────────────────────────

export interface CreateProfileDTO {
  id: string // user id from auth
  email: string
  role: UserRole
  tenantId?: string | null
  displayName?: string
}

export interface UpdateProfileDTO {
  role?: UserRole
  tenantId?: string | null
  displayName?: string
  isActive?: boolean
}

// ─── Tenant ─────────────────────────────────────────────────────────────────

export interface CreateTenantDTO {
  name: string
  maxActiveSessions?: number
  maxAnalysesPerMonth?: number
}

export interface UpdateTenantDTO {
  name?: string
  isActive?: boolean
  maxActiveSessions?: number
  maxAnalysesPerMonth?: number
}

// ─── Viewer Link ────────────────────────────────────────────────────────────

export interface CreateViewerLinkDTO {
  sessionId: string
  expiresInHours: number
  createdBy: string
}

// ─── Usage Log ──────────────────────────────────────────────────────────────

export interface CreateUsageLogDTO {
  tenantId: string
  action: string
  metadata?: Record<string, string | number | boolean>
}

// ─── Analysis ───────────────────────────────────────────────────────────────

export interface CreateAnalysisDTO {
  sessionId: string
  content: string
  model: string
  tokensUsed?: number
  durationMs?: number
}

// ─── AI ─────────────────────────────────────────────────────────────────────

export interface AICompletionOptions {
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

// ─── Shared Types ───────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'editor'

// ─── Domain Entities (Return Types) ─────────────────────────────────────────

export interface Session {
  id: string
  name: string
  isActive: boolean
  tenantId: string | null
  instrumentVersionId: string | null
  createdAt: string
}

export interface Respondent {
  id: string
  sessionId: string
  name: string
  email: string
  completed: boolean
  createdAt: string
  completedAt: string | null
}

export interface Response {
  id: string
  respondentId: string
  questionId: string
  value: number
  createdAt: string
}

export interface Dimension {
  id: string
  name: string
  description: string
  displayOrder: number
  color: string
}

export interface Question {
  id: string
  dimensionId: string
  text: string
  displayOrder: number
  type?: string // 'likert' | 'boolean' | 'text' — default 'likert'
  isRequired?: boolean // default true
  contributesToScore?: boolean // default true
}

export interface DimensionWithQuestions extends Dimension {
  questions: Question[]
}

export interface ResponseWithQuestion extends Response {
  question: Question
  dimension: Dimension
}

export interface DimensionScore {
  dimensionName: string
  dimensionColor: string
  averageValue: number
  responseCount: number
}

export interface Instrument {
  id: string
  name: string
  description: string | null
  createdAt: string
}

export interface InstrumentVersion {
  id: string
  instrumentId: string
  versionNumber: number
  isActive: boolean
  isCurrent?: boolean
}

export interface InstrumentVersionWithDetails {
  id: string
  instrumentName: string
  instrumentDescription: string | null
  versionTag: string | null
  scaleLabels: unknown[] | null
  maturityLevels: unknown[] | null
}

export interface InstrumentWithVersion extends Instrument {
  activeVersion: InstrumentVersion | null
}

export interface InstrumentWithAllVersions extends Instrument {
  versions: InstrumentVersion[]
  currentVersion: InstrumentVersion | null
}

export interface SessionWithRespondentCount extends Session {
  respondentCount: number
  instrumentName?: string
  versionTag?: string
}

export interface SessionWithInstrumentDetails extends Session {
  instrumentName?: string
  versionTag?: string
  maturityLevels?: unknown[] | null
}

export interface RawResponse {
  questionId: string
  value: number | null
  textValue: string | null
}

export interface Profile {
  id: string
  email: string
  role: UserRole
  tenantId: string | null
  isActive: boolean
  displayName: string | null
}

export interface Tenant {
  id: string
  name: string
  isActive: boolean
  maxActiveSessions: number
  maxAnalysesPerMonth: number
}

export interface LimitCheck {
  allowed: boolean
  current: number
  limit: number
  message?: string
}

export interface ViewerLink {
  token: string
  sessionId: string
  expiresAt: string
  isRevoked: boolean
  createdBy: string
}

export interface UsageLog {
  id: string
  tenantId: string
  action: string
  createdAt: string
}

export interface Analysis {
  id: string
  sessionId: string
  content: string
  model: string
  tokensUsed: number | null
  durationMs: number | null
  createdAt: string
}

export interface AuthUser {
  id: string
  email: string
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export interface AICompletion {
  content: string
  model: string
  tokensUsed: number
  durationMs: number
}

export interface AIModelInfo {
  name: string
  provider: string
  maxTokens: number
}

export interface MetricsSnapshot {
  counters: Record<string, number>
  histograms: Record<string, { count: number; sum: number; p50: number; p95: number; p99: number }>
  timestamp: string
}
