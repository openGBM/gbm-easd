// Application Services barrel export
export { SessionService } from './session.service'
export type { CreateSessionInput, SessionWithStats, DashboardStats, SessionDetail } from './session.service'

export { RespondentService } from './respondent.service'
export type { RegisterRespondentInput, RegisterResult } from './respondent.service'

export { InstrumentService } from './instrument.service'
export type { CreateInstrumentInput, InstrumentWithStats } from './instrument.service'

export { SurveyService } from './survey.service'
export type { SurveyPageData, SaveResponseInput, PreviousResponses } from './survey.service'

export { AnalyticsService } from './analytics.service'
export type { TrendFilters, RespondentHistoryResult, RespondentSessionResult } from './analytics.service'

// Helper factories
export {
  createSessionService,
  createRespondentService,
  createInstrumentService,
  createSurveyService,
  createAnalyticsService,
} from './factories'
