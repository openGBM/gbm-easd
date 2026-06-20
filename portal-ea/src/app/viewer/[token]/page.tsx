import { createServerSupabaseClient } from '@/lib/supabase/server'
import ResultsPageContent from '@/components/ResultsPageContent'

interface Props {
  params: Promise<{ token: string }>
}

export default async function ViewerPage({ params }: Props) {
  const { token } = await params

  // Validar token via API
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  const validationRes = await fetch(`${baseUrl}/api/viewer-link?token=${encodeURIComponent(token)}`, {
    cache: 'no-store',
  })

  if (!validationRes.ok) {
    const error = await validationRes.json().catch(() => ({ error: 'Enlace no válido' }))
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md text-center">
          <img src="/logo-gbm.png" alt="GBM" className="h-10 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-red-600 mb-2">
            {validationRes.status === 410 ? 'Enlace expirado' : 'Enlace no válido'}
          </h1>
          <p className="text-gray-600">{error.error || 'Este enlace de visualización no es válido o ha expirado.'}</p>
        </div>
      </div>
    )
  }

  const { session_id } = await validationRes.json()

  // Cargar datos consolidados de la sesión
  const supabase = await createServerSupabaseClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('name, instrument_version_id')
    .eq('id', session_id)
    .single()

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600">Sesión no encontrada</h1>
        </div>
      </div>
    )
  }

  // Cargar respondentes completados
  const { data: respondents } = await supabase
    .from('respondents')
    .select('id')
    .eq('session_id', session_id)
    .eq('completed', true)

  if (!respondents || respondents.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <img src="/logo-gbm.png" alt="GBM" className="h-10 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-yellow-600 mb-2">Sin respuestas aún</h1>
          <p className="text-gray-600">Esta sesión aún no tiene encuestados completados.</p>
        </div>
      </div>
    )
  }

  // Cargar respuestas consolidadas
  const ids = respondents.map(r => r.id)
  const { data: responses } = await supabase
    .from('responses')
    .select('value, text_value, questions(text, type, contributes_to_score, dimensions(name, display_order))')
    .in('respondent_id', ids)

  if (!responses || responses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-bold text-yellow-600">Sin datos</h1>
        </div>
      </div>
    )
  }

  // Calcular promedios por dimensión (solo Likert que contribuyen)
  const dimensionScores: Record<string, { name: string; total: number; count: number; order: number }> = {}
  const booleanData: { question: string; dimension: string; yesCount: number; noCount: number }[] = []
  const booleanAgg: Record<string, { question: string; dimension: string; yes: number; no: number }> = {}

  responses.forEach((r: any) => {
    const qType = r.questions?.type || 'likert'
    const contributes = r.questions?.contributes_to_score !== false
    const dimName = r.questions?.dimensions?.name
    const dimOrder = r.questions?.dimensions?.display_order
    if (!dimName) return

    if (qType === 'likert' && contributes && r.value && r.value > 0) {
      if (!dimensionScores[dimName]) {
        dimensionScores[dimName] = { name: dimName, total: 0, count: 0, order: dimOrder }
      }
      dimensionScores[dimName].total += r.value
      dimensionScores[dimName].count += 1
    }

    if (qType === 'boolean' && r.value !== null) {
      const key = r.questions.text
      if (!booleanAgg[key]) {
        booleanAgg[key] = { question: r.questions.text, dimension: dimName, yes: 0, no: 0 }
      }
      if (r.value === 1) booleanAgg[key].yes++
      else booleanAgg[key].no++
    }
  })

  const chartData = Object.values(dimensionScores)
    .sort((a, b) => a.order - b.order)
    .map(d => ({ dimension: d.name, value: Math.round((d.total / d.count) * 10) / 10 }))

  const tableData = Object.values(dimensionScores)
    .sort((a, b) => a.order - b.order)
    .map(d => ({ dimension: d.name, value: d.total, questionCount: d.count }))

  Object.values(booleanAgg).forEach(b => {
    booleanData.push({ question: b.question, dimension: b.dimension, yesCount: b.yes, noCount: b.no })
  })

  // Cargar maturity levels
  let maturityLevels = null
  if (session.instrument_version_id) {
    const { data: versionData } = await supabase
      .from('instrument_versions')
      .select('maturity_levels')
      .eq('id', session.instrument_version_id)
      .single()
    if (versionData?.maturity_levels) maturityLevels = versionData.maturity_levels
  }

  return (
    <ResultsPageContent
      respondentName={`Consolidado (${respondents.length} encuestados)`}
      respondentDate={new Date().toLocaleDateString('es-MX')}
      sessionName={session.name}
      chartData={chartData}
      tableData={tableData}
      maturityLevels={maturityLevels}
      booleanData={booleanData}
    />
  )
}
