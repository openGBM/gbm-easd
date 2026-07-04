import type { ResponseRepository } from '../ports/repositories/response.repository'
import type { RespondentRepository } from '../ports/repositories/respondent.repository'
import type { SessionRepository } from '../ports/repositories/session.repository'
import type { DimensionScore } from '../types/dtos'
import type { DomainError } from '../errors/domain-errors'
import type { Result } from '../errors/result'
import { ok, isOk } from '../errors/result'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TrendFilters {
  fromDate?: string
  toDate?: string
  sessionIds?: string[]
}

// ─── Service ────────────────────────────────────────────────────────────────

export class AnalyticsService {
  constructor(
    private readonly responseRepo: ResponseRepository,
    private readonly respondentRepo: RespondentRepository,
    private readonly sessionRepo: SessionRepository,
  ) {}

  /**
   * Scores consolidados de una sesión (promedio de todos los respondents completados).
   */
  async getConsolidatedScores(sessionId: string): Promise<Result<DimensionScore[], DomainError>> {
    return this.responseRepo.getAggregatedBySession(sessionId)
  }

  /**
   * Scores individuales de un respondent.
   */
  async getIndividualScores(respondentId: string): Promise<Result<DimensionScore[], DomainError>> {
    return this.responseRepo.getAggregatedByRespondent(respondentId)
  }

  /**
   * Historial de un encuestado por email — todas sus participaciones.
   * Retorna las sesiones en las que participó con sus scores por sesión.
   */
  async getRespondentHistory(email: string): Promise<Result<RespondentHistoryResult, DomainError>> {
    // Buscar sesiones — actualmente requeriría una query custom
    // que no está en los repos. Placeholder para Unit 4.5.
    // La implementación completa necesita:
    //   1. Buscar respondents por email across all sessions
    //   2. Para cada respondent, obtener sus scores
    //   3. Agrupar por sesión con metadata

    return ok({
      email,
      sessions: [],
    })
  }
}

export interface RespondentHistoryResult {
  email: string
  sessions: RespondentSessionResult[]
}

export interface RespondentSessionResult {
  sessionId: string
  sessionName: string
  completedAt: string
  scores: DimensionScore[]
}
