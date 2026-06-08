import { createServerSupabaseClient } from '@/lib/supabase/server'
import SurveyForm from '@/components/SurveyForm'
import { Dimension } from '@/types/database'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function EncuestaPage({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createServerSupabaseClient()

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

  // Cargar dimensiones
  const { data: dimensions } = await supabase
    .from('dimensions')
    .select('*')
    .order('display_order', { ascending: true })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Evaluación de Madurez EA
          </h1>
          <p className="text-gray-600 mt-2">Sesión: {session.name}</p>
        </div>

        <SurveyForm
          sessionId={sessionId}
          dimensions={(dimensions as Dimension[]) || []}
        />
      </div>
    </div>
  )
}
