import type { SessionRepository } from '../ports/repositories/session.repository'
import type { RespondentRepository } from '../ports/repositories/respondent.repository'
import type { InstrumentRepository } from '../ports/repositories/instrument.repository'
import type { TenantRepository } from '../ports/repositories/tenant.repository'
import type { Session, SessionFilters } from '../types/dtos'
import type { DomainError } from '../errors/domain-errors'
import type { Result } from '../errors/result'
import { ok, err, isOk } from '../errors/result'
import { NotFoundError, ForbiddenError, InternalError } from '../errors/domain-errors'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreateSessionInput {
  name: string
  instrumentId?: string
  tenantId?: string
}

export interface SessionWithStats extends Session {
  respondentCount: number
  instrumentName?: string
  versionTag?: string
}

export interface DashboardStats {
  activeSessions: number
  totalCompleted: number
  avgTimeMinutes: number
  totalInstruments: number
}

export interface SessionDetail extends Session {
  respondentCount: number
  completedCount: number
  instrumentInfo?: { name: string; versionTag: string }
}

// ─── Service ────────────────────────────────────────────────────────────────

export class SessionService {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly respondentRepo: RespondentRepository,
    private readonly instrumentRepo: InstrumentRepository,
    private readonly tenantRepo: TenantRepository,
  ) {}

  /**
   * Crear sesión verificando límite del tenant + resolviendo versión del instrumento.
   */
  async createSession(data: CreateSessionInput): Promise<Result<Session, DomainError>> {
    // Verificar límite del tenant si aplica
    if (data.tenantId) {
      const limitResult = await this.tenantRepo.checkSessionLimit(data.tenantId)
      if (isOk(limitResult) && !limitResult.value.allowed) {
        return err(new ForbiddenError(
          limitResult.value.message || 'Límite de sesiones alcanzado',
        ))
      }
    }

    // Resolver instrument_version_id si se proporcionó instrumentId
    let instrumentVersionId: string | null = null
    if (data.instrumentId) {
      const versionResult = await this.instrumentRepo.findActiveVersion(data.instrumentId)
      if (isOk(versionResult)) {
        instrumentVersionId = versionResult.value.id
      }
    }

    return this.sessionRepo.create({
      name: data.name,
      tenantId: data.tenantId ?? null,
      instrumentVersionId,
    })
  }

  /**
   * Listar sesiones con conteo de respondents.
   */
  async listSessionsWithStats(filters?: SessionFilters): Promise<Result<SessionWithStats[], DomainError>> {
    const sessionsResult = await this.sessionRepo.findAll(filters)
    if (!isOk(sessionsResult)) return sessionsResult

    const sessions = sessionsResult.value
    const withStats: SessionWithStats[] = []

    for (const session of sessions) {
      const countResult = await this.respondentRepo.countBySession(session.id)
      const count = isOk(countResult) ? countResult.value : 0

      withStats.push({
        ...session,
        respondentCount: count,
      })
    }

    return ok(withStats)
  }

  /**
   * Dashboard stats generales.
   */
  async getDashboardStats(): Promise<Result<DashboardStats, DomainError>> {
    const activeResult = await this.sessionRepo.countActive()
    const instrumentsResult = await this.instrumentRepo.findAll()

    return ok({
      activeSessions: isOk(activeResult) ? activeResult.value : 0,
      totalCompleted: 0, // Se calcula con query específica en Unit 4.5
      avgTimeMinutes: 0, // Se calcula con query específica en Unit 4.5
      totalInstruments: isOk(instrumentsResult) ? instrumentsResult.value.length : 0,
    })
  }

  /**
   * Eliminar sesión con cascade (respondents + responses).
   */
  async deleteSessionCascade(sessionId: string): Promise<Result<void, DomainError>> {
    // Primero eliminar todos los respondents (que a su vez eliminan responses)
    const respondentsResult = await this.respondentRepo.findBySessionId(sessionId)
    if (isOk(respondentsResult)) {
      for (const respondent of respondentsResult.value) {
        await this.respondentRepo.delete(respondent.id)
      }
    }

    // Luego eliminar la sesión
    return this.sessionRepo.delete(sessionId)
  }

  /**
   * Obtener detalle de sesión con respondent stats.
   */
  async getSessionDetail(sessionId: string): Promise<Result<SessionDetail, DomainError>> {
    const sessionResult = await this.sessionRepo.findById(sessionId)
    if (!isOk(sessionResult)) return sessionResult

    const countResult = await this.respondentRepo.countBySession(sessionId)
    const respondentsResult = await this.respondentRepo.findBySessionId(sessionId)

    const respondents = isOk(respondentsResult) ? respondentsResult.value : []
    const completedCount = respondents.filter(r => r.completed).length

    return ok({
      ...sessionResult.value,
      respondentCount: isOk(countResult) ? countResult.value : 0,
      completedCount,
    })
  }
}
