import { getServerContainer } from '@/core/server-container'
import { TOKENS } from '@/core/types/tokens'
import { isOk } from '@/core/errors/result'
import { createAnalyticsService } from '@/core/services/factories'
import ResultsPageContent from '@/components/ResultsPageContent'

interface Props {
  params: Promise<{ respondentId: string }>
}

export default async function ResultadosPage({ params }: Props) {
  const { respondentId } = await params

  // Validar formato UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(respondentId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Enlace inválido</h1>
          <p className="text-gray-600">El enlace de resultados no es válido.</p>
        </div>
      </div>
    )
  }

  const container = getServerContainer()
  const respondentRepo = container.resolve(TOKENS.RespondentRepository)
  const analyticsService = createAnalyticsService(container)

  // Verificar que el encuestado existe y completó
  const respondentResult = await respondentRepo.findById(respondentId)
  if (!isOk(respondentResult)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Resultados no encontrados</h1>
          <p className="text-gray-600">No se encontraron resultados para este enlace.</p>
        </div>
      </div>
    )
  }

  const respondent = respondentResult.value
  if (!respondent.completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-yellow-600 mb-2">Encuesta no completada</h1>
          <p className="text-gray-600">Los resultados estarán disponibles al completar la encuesta.</p>
        </div>
      </div>
    )
  }

  // Obtener scores del respondent via AnalyticsService
  const scoresResult = await analyticsService.getIndividualScores(respondentId)
  const scores = isOk(scoresResult) ? scoresResult.value : []

  if (scores.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-yellow-600 mb-2">Sin respuestas</h1>
          <p className="text-gray-600">Aún no se han registrado respuestas.</p>
        </div>
      </div>
    )
  }

  // Cargar info adicional de sesión + instrumento (queries específicas aún vía Supabase directo)
  // TODO (extensión futura): Mover a SurveyService o SessionService cuando se extiendan los repos
  let sessionName = ''
  let maturityLevels = null

  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()

    const { data: respondentData } = await supabase
      .from('respondents')
      .select('sessions(name, instrument_version_id)')
      .eq('id', respondentId)
      .single()

    if (respondentData) {
      sessionName = (respondentData as any).sessions?.name || ''
      const instrumentVersionId = (respondentData as any).sessions?.instrument_version_id
      if (instrumentVersionId) {
        const { data: versionData } = await supabase
          .from('instrument_versions')
          .select('maturity_levels')
          .eq('id', instrumentVersionId)
          .single()
        if (versionData?.maturity_levels) {
          maturityLevels = versionData.maturity_levels
        }
      }
    }
  } catch {
    // Fail gracefully — scores still shown without maturity levels
  }

  // Transformar scores a formato del componente
  const chartData = scores.map(s => ({
    dimension: s.dimensionName,
    value: Math.round(s.averageValue * 10) / 10,
  }))

  const tableData = scores.map(s => ({
    dimension: s.dimensionName,
    value: Math.round(s.averageValue * s.responseCount),
    questionCount: s.responseCount,
  }))

  return (
    <ResultsPageContent
      respondentName={respondent.name}
      respondentDate={new Date(respondent.createdAt).toLocaleDateString('es-MX')}
      sessionName={sessionName}
      chartData={chartData}
      tableData={tableData}
      maturityLevels={maturityLevels}
      booleanData={[]}
      textData={[]}
    />
  )
}
