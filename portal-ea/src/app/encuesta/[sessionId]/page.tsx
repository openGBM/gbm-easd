import { createServerSupabaseClient } from '@/lib/supabase/server'
import SurveyForm from '@/components/SurveyForm'
import { DimensionWithQuestions } from '@/types/database'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function EncuestaPage({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createServerSupabaseClient()

  // Validar formato UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(sessionId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Enlace inválido</h1>
          <p className="text-gray-600">El enlace de la encuesta no es válido.</p>
        </div>
      </div>
    )
  }

  // Verificar que la sesión existe y está activa
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Sesión no encontrada</h1>
          <p className="text-gray-600">El enlace de la encuesta no es válido.</p>
        </div>
      </div>
    )
  }

  if (!session.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-yellow-600 mb-2">Sesión no disponible</h1>
          <p className="text-gray-600">Esta sesión de evaluación no está activa en este momento.</p>
        </div>
      </div>
    )
  }

  // Cargar dimensiones con sus preguntas
  // Si la sesión tiene instrument_version_id, cargar dimensiones de esa versión
  // Si no (v1.x), cargar todas las dimensiones disponibles
  let dimensions: any[] | null = null

  if (session.instrument_version_id) {
    const { data } = await supabase
      .from('dimensions')
      .select('*, questions(*)')
      .eq('instrument_version_id', session.instrument_version_id)
      .order('display_order', { ascending: true })
    dimensions = data
  }

  // Fallback: si no se encontraron dimensiones con la versión, cargar sin filtro
  if (!dimensions || dimensions.length === 0) {
    const { data } = await supabase
      .from('dimensions')
      .select('*, questions(*)')
      .order('display_order', { ascending: true })
    dimensions = data
  }

  const { data: dimensionsResult } = { data: dimensions }

  // Cargar scale_labels y nombre del instrumento si la sesión tiene versión
  let scaleLabels = null
  let instrumentName = 'Evaluación'
  if (session.instrument_version_id) {
    const { data: versionData } = await supabase
      .from('instrument_versions')
      .select('scale_labels, instruments(name)')
      .eq('id', session.instrument_version_id)
      .single()

    if (versionData?.scale_labels) {
      scaleLabels = versionData.scale_labels
    }
    if ((versionData as any)?.instruments?.name) {
      instrumentName = (versionData as any).instruments.name
    }
  }

  // Ordenar preguntas dentro de cada dimensión
  const sortedDimensions: DimensionWithQuestions[] = (dimensionsResult || []).map(dim => ({
    ...dim,
    questions: (dim.questions || []).sort(
      (a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order
    ),
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <img src="/logo-gbm.png" alt="GBM" className="h-10 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">
            {instrumentName}
          </h1>
          <p className="text-gray-600 mt-2">Sesión: {session.name}</p>
          <p className="text-sm text-gray-400 mt-1">
            Selecciona el valor (1–5) que mejor refleje tu valoración para cada afirmación
          </p>
        </div>

        <SurveyForm
          sessionId={sessionId}
          dimensions={sortedDimensions}
          scaleLabels={scaleLabels}
        />
      </div>
    </div>
  )
}
