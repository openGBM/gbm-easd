// Supabase adapter barrel export
export {
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
} from './repositories'

export {
  createBrowserSupabaseClient,
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from './client-factory'
