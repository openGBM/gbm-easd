import { createServerSupabaseClient } from '@/lib/supabase/server'
import RadarChart from '@/components/RadarChart'
import ResultsTable from '@/components/ResultsTable'

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

  // Cargar encuestado (solo si completó)
  const { data: respondent } = await supabase
    .from('respondents')
    .select('*, sessions(name)')
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
  const dimensionScores: Record<string, { name: string; total: number; count: number; order: number }> = {}

  responses.forEach((r: any) => {
    const dimId = r.questions.dimensions.id
    const dimName = r.questions.dimensions.name
    const dimOrder = r.questions.dimensions.display_order

    if (!dimensionScores[dimId]) {
      dimensionScores[dimId] = { name: dimName, total: 0, count: 0, order: dimOrder }
    }
    dimensionScores[dimId].total += r.value
    dimensionScores[dimId].count += 1
  })

  const chartData = Object.values(dimensionScores)
    .sort((a, b) => a.order - b.order)
    .map(d => ({
      dimension: d.name,
      value: Math.round((d.total / d.count) * 10) / 10,
    }))

  // Datos para la tabla: suma por dimensión
  const tableData = Object.values(dimensionScores)
    .sort((a, b) => a.order - b.order)
    .map(d => ({
      dimension: d.name,
      value: d.total,
      questionCount: d.count,
    }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <img src="/logo-gbm.png" alt="GBM" className="h-10 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">
            Resultados de Evaluación
          </h1>
          {sessionName && (
            <p className="text-lg text-gray-700 mt-1">{sessionName}</p>
          )}
          <p className="text-gray-600 mt-2">
            Encuestado: {respondent.name} — {new Date(respondent.created_at).toLocaleDateString('es-MX')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Gráfico de Radar (promedio por dimensión, escala 1-5) */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4 text-center">Gráfico de Radar</h2>
            <p className="text-xs text-gray-400 text-center mb-2">Promedio por dimensión (escala 1-5)</p>
            <RadarChart data={chartData} />
          </div>

          {/* Tabla de Resultados (suma por dimensión) */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4 text-center">Resumen por Dimensión</h2>
            <p className="text-xs text-gray-400 text-center mb-2">Suma de respuestas por dimensión (escala 1-5)</p>
            <ResultsTable data={tableData} />
          </div>
        </div>
      </div>
    </div>
  )
}
