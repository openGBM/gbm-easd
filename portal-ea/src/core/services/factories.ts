import type { Container } from '../container-impl'
import { TOKENS } from '../types/tokens'
import { SessionService } from './session.service'
import { RespondentService } from './respondent.service'
import { InstrumentService } from './instrument.service'
import { SurveyService } from './survey.service'
import { AnalyticsService } from './analytics.service'

/**
 * Helper factories para instanciar Application Services.
 * Cada factory resuelve los repos necesarios del Container y retorna el service listo.
 *
 * Uso:
 *   const sessionService = createSessionService(getServerContainer())
 *   const result = await sessionService.createSession(...)
 */

export function createSessionService(container: Container): SessionService {
  return new SessionService(
    container.resolve(TOKENS.SessionRepository),
    container.resolve(TOKENS.RespondentRepository),
    container.resolve(TOKENS.InstrumentRepository),
    container.resolve(TOKENS.TenantRepository),
  )
}

export function createRespondentService(container: Container): RespondentService {
  return new RespondentService(
    container.resolve(TOKENS.RespondentRepository),
    container.resolve(TOKENS.SessionRepository),
    container.resolve(TOKENS.ResponseRepository),
  )
}

export function createInstrumentService(container: Container): InstrumentService {
  return new InstrumentService(
    container.resolve(TOKENS.InstrumentRepository),
    container.resolve(TOKENS.DimensionRepository),
    container.resolve(TOKENS.QuestionRepository),
  )
}

export function createSurveyService(container: Container): SurveyService {
  return new SurveyService(
    container.resolve(TOKENS.SessionRepository),
    container.resolve(TOKENS.DimensionRepository),
    container.resolve(TOKENS.ResponseRepository),
    container.resolve(TOKENS.RespondentRepository),
  )
}

export function createAnalyticsService(container: Container): AnalyticsService {
  return new AnalyticsService(
    container.resolve(TOKENS.ResponseRepository),
    container.resolve(TOKENS.RespondentRepository),
    container.resolve(TOKENS.SessionRepository),
  )
}
