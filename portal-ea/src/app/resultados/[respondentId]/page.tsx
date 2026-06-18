import { createServerSupabaseClient } from '@/lib/supabase/server'
import ResultsPageContent from '@/components/ResultsPageContent'

interface Props {
  params: Promise<{ respondentId: string }>
}

export default async function ResultadosPage({ params }: Props) {
  const { respondentId } = await params
  const supabase = await createServerSupabaseClient()

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

  // Cargar encuestado (solo si completó) con info de sesión e instrumento
  const { data: respondent } = await supabase
    .from('respondents')
    .select('*, sessions(name, instrument_version_id)')
    .eq('id', respondentId)
    .eq('completed', true)
    .single()

  if (!respondent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Resultados no encontrados</h1>
          <p className="text-gray-600">No se encontraron resultados para este enlace.</p>
        </div>
      </div>
    )
  }

  const sessionName = (respondent as any).sessions?.name || ''

  // Cargar niveles de madurez del instrumento (si existe)
  let maturityLevels = null
  const instrumentVersionId = (respondent as any).sessions?.instrument_version_id
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

  // Cargar respuestas con preguntas y dimensiones
  const { data: responses } = await supabase
    .from('responses')
    .select('*, questions(*, dimensions(*))')
    .eq('respondent_id', respondentId)

  if (!responses || responses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-yellow-600 mb-2">Sin respuestas</h1>
          <p className="text-gray-600">Aún no se han registrado respuestas.</p>
        </div>
      </div>
    )
  }

  // Calcular promedio por dimensión para el radar chart
  // Solo incluir preguntas Likert que contribuyen al score
  const dimensionScores: Record<string, { name: string; total: number; count: number; order: number }> = {}

  // Recopilar datos boolean para pie charts
  const booleanData: { question: string; dimension: string; yesCount: number; noCount: number }[] = []
  // Recopilar respuestas de texto
  const textData: { question: string; dimension: string; text: string }[] = []

  responses.forEach((r: any) => {
    const dimId = r.questions.dimensions.id
    const dimName = r.questions.dimensions.name
    const dimOrder = r.questions.dimensions.display_order
    const qType = r.questions.type || 'likert'
    const contributesToScore = r.questions.contributes_to_score !== false

    // Radar: solo Likert que contribuyen (excluir value=0 que es sentinel de texto)
    if (qType === 'likert' && contributesToScore && r.value !== null && r.value > 0) {
      if (!dimensionScores[dimId]) {
        dimensionScores[dimId] = { name: dimName, total: 0, count: 0, order: dimOrder }
      }
      dimensionScores[dimId].total += r.value
      dimensionScores[dimId].count += 1
    }

    // Boolean: recopilar para pie chart (individual respondent = 1 respuesta)
    if (qType === 'boolean' && r.value !== null) {
      booleanData.push({
        question: r.questions.text,
        dimension: dimName,
        yesCount: r.value === 1 ? 1 : 0,
        noCount: r.value === 0 ? 1 : 0,
      })
    }

    // Texto libre
    if (qType === 'text' && r.text_value) {
      textData.push({
        question: r.questions.text,
        dimension: dimName,
        text: r.text_value,
      })
    }
  })

  const chartData = Object.values(dimensionScores)
    .sort((a, b) => a.order - b.order)
    .map(d => ({
      dimension: d.name,
      value: Math.round((d.total / d.count) * 10) / 10,
    }))

  const tableData = Object.values(dimensionScores)
    .sort((a, b) => a.order - b.order)
    .map(d => ({
      dimension: d.name,
      value: d.total,
      questionCount: d.count,
    }))

  return (
    <ResultsPageContent
      respondentName={respondent.name}
      respondentDate={new Date(respondent.created_at).toLocaleDateString('es-MX')}
      sessionName={sessionName}
      chartData={chartData}
      tableData={tableData}
      maturityLevels={maturityLevels}
      booleanData={booleanData}
      textData={textData}
    />
  )
}
