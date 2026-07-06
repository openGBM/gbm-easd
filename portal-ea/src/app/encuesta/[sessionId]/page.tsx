import { getServerContainer } from '@/core/server-container'
import { TOKENS } from '@/core/types/tokens'
import { isOk } from '@/core/errors/result'
import SurveyForm from '@/components/SurveyForm'
import { DimensionWithQuestions } from '@/types/database'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ sessionId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(sessionId)) {
    return { title: 'Evaluación GBM' }
  }

  const container = getServerContainer()
  const sessionRepo = container.resolve(TOKENS.SessionRepository)
  const instrumentRepo = container.resolve(TOKENS.InstrumentRepository)

  const sessionResult = await sessionRepo.findById(sessionId)
  if (!isOk(sessionResult)) {
    return { title: 'Evaluación GBM' }
  }

  const session = sessionResult.value
  let instrumentName = 'Evaluación'

  if (session.instrumentVersionId) {
    const versionResult = await instrumentRepo.findVersionWithInstrument(session.instrumentVersionId)
    if (isOk(versionResult) && versionResult.value.instrumentName) {
      instrumentName = versionResult.value.instrumentName
    }
  }

  return {
    title: `${instrumentName} — GBM`,
    description: `Sesión: ${session.name}. Completa esta evaluación para conocer tu nivel de preparación.`,
  }
}

export default async function EncuestaPage({ params }: Props) {
  const { sessionId } = await params

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

  const container = getServerContainer()
  const sessionRepo = container.resolve(TOKENS.SessionRepository)
  const dimensionRepo = container.resolve(TOKENS.DimensionRepository)
  const instrumentRepo = container.resolve(TOKENS.InstrumentRepository)

  // Verificar que la sesión existe
  const sessionResult = await sessionRepo.findById(sessionId)

  if (!isOk(sessionResult)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Sesión no encontrada</h1>
          <p className="text-gray-600">El enlace de la encuesta no es válido.</p>
        </div>
      </div>
    )
  }

  const session = sessionResult.value

  if (!session.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md text-center">
          <img src="/logo-gbm.png" alt="GBM" className="h-10 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sesión no disponible</h1>
          <p className="text-gray-600">Esta evaluación no está aceptando respuestas en este momento.</p>
        </div>
      </div>
    )
  }

  // Cargar dimensiones con preguntas usando el repositorio
  let dimensionsData: DimensionWithQuestions[] = []
  let scaleLabels: any = null
  let instrumentName = 'Evaluación'
  let instrumentDescription: string | null = null

  if (session.instrumentVersionId) {
    // Cargar dimensiones por versión
    const dimResult = await dimensionRepo.findByInstrumentVersionId(session.instrumentVersionId)
    if (isOk(dimResult) && dimResult.value.length > 0) {
      dimensionsData = dimResult.value.map(dim => ({
        ...dim,
        id: dim.id,
        name: dim.name,
        description: dim.description,
        color: dim.color,
        display_order: dim.displayOrder,
        questions: dim.questions.map(q => ({
          ...q,
          id: q.id,
          text: q.text,
          display_order: q.displayOrder,
          dimension_id: q.dimensionId,
        })),
      })) as any
    }

    // Cargar info del instrumento (nombre, descripción, escala)
    const versionResult = await instrumentRepo.findVersionWithInstrument(session.instrumentVersionId)
    if (isOk(versionResult)) {
      instrumentName = versionResult.value.instrumentName || 'Evaluación'
      instrumentDescription = versionResult.value.instrumentDescription || null
      scaleLabels = versionResult.value.scaleLabels || null
    }
  }

  // Fallback: si no hay dimensiones para la versión, cargar todas
  if (dimensionsData.length === 0) {
    const allDimsResult = await dimensionRepo.findWithQuestions()
    if (isOk(allDimsResult)) {
      dimensionsData = allDimsResult.value.map(dim => ({
        ...dim,
        id: dim.id,
        name: dim.name,
        description: dim.description,
        color: dim.color,
        display_order: dim.displayOrder,
        questions: dim.questions.map(q => ({
          ...q,
          id: q.id,
          text: q.text,
          display_order: q.displayOrder,
          dimension_id: q.dimensionId,
        })),
      })) as any
    }
  }

  // Ordenar preguntas dentro de cada dimensión
  const sortedDimensions: DimensionWithQuestions[] = dimensionsData.map((dim: any) => ({
    ...dim,
    questions: (dim.questions || []).sort(
      (a: { display_order?: number; displayOrder?: number }, b: { display_order?: number; displayOrder?: number }) =>
        (a.display_order ?? a.displayOrder ?? 0) - (b.display_order ?? b.displayOrder ?? 0)
    ),
  }))

  // Calcular stats para la landing page
  const totalQuestions = sortedDimensions.reduce((sum, dim) => sum + dim.questions.length, 0)
  const estimatedMinutes = Math.max(3, Math.round(totalQuestions * 15 / 60))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <SurveyForm
          sessionId={sessionId}
          dimensions={sortedDimensions}
          scaleLabels={scaleLabels}
          instrumentName={instrumentName}
          instrumentDescription={instrumentDescription}
          sessionName={session.name}
          totalDimensionsCount={sortedDimensions.length}
          totalQuestionsCount={totalQuestions}
          estimatedMinutes={estimatedMinutes}
        />
      </div>
    </div>
  )
}
