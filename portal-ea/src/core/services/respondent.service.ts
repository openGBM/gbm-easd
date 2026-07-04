import type { RespondentRepository } from '../ports/repositories/respondent.repository'
import type { SessionRepository } from '../ports/repositories/session.repository'
import type { ResponseRepository } from '../ports/repositories/response.repository'
import type { Respondent } from '../types/dtos'
import type { DomainError } from '../errors/domain-errors'
import type { Result } from '../errors/result'
import { ok, err, isOk } from '../errors/result'
import { NotFoundError, ForbiddenError, ConflictError } from '../errors/domain-errors'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RegisterRespondentInput {
  sessionId: string
  name: string
  email: string
}

export interface RegisterResult {
  respondentId: string
  resumed: boolean
}

// ─── Service ────────────────────────────────────────────────────────────────

export class RespondentService {
  constructor(
    private readonly respondentRepo: RespondentRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly responseRepo: ResponseRepository,
  ) {}

  /**
   * Registrar o reanudar encuestado.
   * Verifica sesión activa, maneja duplicados, y permite reanudación.
   */
  async registerOrResume(data: RegisterRespondentInput): Promise<Result<RegisterResult, DomainError>> {
    // Verificar que la sesión existe y está activa
    const sessionResult = await this.sessionRepo.findById(data.sessionId)
    if (!isOk(sessionResult)) {
      return err(new NotFoundError('Sesión no encontrada'))
    }

    if (!sessionResult.value.isActive) {
      return err(new ForbiddenError('La sesión no está activa'))
    }

    // Verificar si ya existe un encuestado con ese email
    const existingResult = await this.respondentRepo.findByEmail(data.sessionId, data.email)
    if (isOk(existingResult) && existingResult.value) {
      const existing = existingResult.value

      if (existing.completed) {
        return err(new ConflictError('Ya respondiste esta encuesta.', { code: 'ALREADY_COMPLETED' }))
      }

      // Permitir reanudar
      return ok({ respondentId: existing.id, resumed: true })
    }

    // Crear nuevo encuestado
    const createResult = await this.respondentRepo.create({
      sessionId: data.sessionId,
      name: data.name,
      email: data.email,
    })

    if (!isOk(createResult)) {
      return createResult
    }

    return ok({ respondentId: createResult.value.id, resumed: false })
  }

  /**
   * Eliminar encuestado con cascade (responses se eliminan en el repo).
   */
  async deleteCascade(respondentId: string): Promise<Result<void, DomainError>> {
    return this.respondentRepo.delete(respondentId)
  }

  /**
   * Marcar encuesta como completada.
   */
  async completeSubmission(respondentId: string): Promise<Result<void, DomainError>> {
    return this.respondentRepo.markCompleted(respondentId)
  }
}
