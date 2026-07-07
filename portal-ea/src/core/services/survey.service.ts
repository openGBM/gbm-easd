import type { SessionRepository } from '../ports/repositories/session.repository'
import type { DimensionRepository } from '../ports/repositories/dimension.repository'
import type { ResponseRepository } from '../ports/repositories/response.repository'
import type { RespondentRepository } from '../ports/repositories/respondent.repository'
import type { Session, DimensionWithQuestions } from '../types/dtos'
import type { DomainError } from '../errors/domain-errors'
import type { Result } from '../errors/result'
import { ok, err, isOk } from '../errors/result'
import { NotFoundError, ForbiddenError } from '../errors/domain-errors'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SurveyPageData {
  session: Session
  dimensions: DimensionWithQuestions[]
  instrumentName: string
  instrumentDescription?: string
  totalQuestions: number
  estimatedMinutes: number
}

export interface SaveResponseInput {
  questionId: string
  value: number
}

export interface PreviousResponses {
  numeric: Record<string, number>
}

// ─── Service ────────────────────────────────────────────────────────────────

export class SurveyService {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly dimensionRepo: DimensionRepository,
    private readonly responseRepo: ResponseRepository,
    private readonly respondentRepo: RespondentRepository,
  ) {}

  /**
   * Cargar todo lo necesario para renderizar la página de encuesta.
   */
  async loadSurveyPage(sessionId: string): Promise<Result<SurveyPageData, DomainError>> {
    // Verificar sesión
    const sessionResult = await this.sessionRepo.findById(sessionId)
    if (!isOk(sessionResult)) {
      return err(new NotFoundError('Sesión no encontrada'))
    }

    const session = sessionResult.value

    if (!session.isActive) {
      return err(new ForbiddenError('La sesión no está activa'))
    }

    // Cargar dimensiones con preguntas
    let dimensionsResult: Result<DimensionWithQuestions[], DomainError>

    if (session.instrumentVersionId) {
      dimensionsResult = await this.dimensionRepo.findByInstrumentVersionId(session.instrumentVersionId)
    } else {
      dimensionsResult = await this.dimensionRepo.findWithQuestions()
    }

    if (!isOk(dimensionsResult)) {
      return err(new NotFoundError('No se encontraron dimensiones'))
    }

    const dimensions = dimensionsResult.value
    const totalQuestions = dimensions.reduce((sum, dim) => sum + dim.questions.length, 0)
    const estimatedMinutes = Math.max(3, Math.round(totalQuestions * 15 / 60))

    return ok({
      session,
      dimensions,
      instrumentName: 'Evaluación', // Se extiende con InstrumentRepository en Unit 4.5
      totalQuestions,
      estimatedMinutes,
    })
  }

  /**
   * Guardar respuestas numéricas (upsert batch).
   */
  async saveResponses(respondentId: string, responses: SaveResponseInput[]): Promise<Result<void, DomainError>> {
    return this.responseRepo.upsertBatch(respondentId, responses)
  }

  /**
   * Marcar encuesta como completada.
   */
  async completeSubmission(respondentId: string): Promise<Result<void, DomainError>> {
    return this.respondentRepo.markCompleted(respondentId)
  }

  /**
   * Cargar respuestas previas para reanudación.
   */
  async loadPreviousResponses(respondentId: string): Promise<Result<PreviousResponses, DomainError>> {
    const responsesResult = await this.responseRepo.findByRespondentId(respondentId)
    if (!isOk(responsesResult)) {
      return ok({ numeric: {} })
    }

    const numeric: Record<string, number> = {}
    for (const response of responsesResult.value) {
      if (response.value !== 0) {
        numeric[response.questionId] = response.value
      }
    }

    return ok({ numeric })
  }
}
