import { createServerSupabaseClient } from '@/lib/supabase/server'
import RadarChart from '@/components/RadarChart'
import ResultsTable from '@/components/ResultsTable'

interface Props {
  params: Promise<{ respondentId: string }>
}

export default async function ResultadosPage({ params }: Props) {
  const { respondentId } = await params
  const supabase = await createServerSupabaseClient()

  // Cargar encuestado
  const { data: respondent } = await supabase
    .from('respondents')
    .select('*')
    .eq('id', respondentId)
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

  // Cargar respuestas con dimensiones
  const { data: responses } = await supabase
    .from('responses')
    .select('*, dimensions(*)')
    .eq('respondent_id', respondentId)
    .order('created_at', { ascending: true })

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

  // Formatear datos para gráficos
  const chartData = responses
    .sort((a, b) => a.dimensions.display_order - b.dimensions.display_order)
    .map(r => ({
      dimension: r.dimensions.name,
      value: r.value,
    }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Resultados de Evaluación
          </h1>
          <p className="text-gray-600 mt-2">
            {respondent.name} — {new Date(respondent.created_at).toLocaleDateString('es-MX')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Gráfico de Radar */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4 text-center">Gráfico de Radar</h2>
            <RadarChart data={chartData} />
          </div>

          {/* Tabla de Resultados */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4 text-center">Resumen de Evaluación</h2>
            <ResultsTable data={chartData} />
          </div>
        </div>
      </div>
    </div>
  )
}
