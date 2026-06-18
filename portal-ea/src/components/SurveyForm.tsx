'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DimensionWithQuestions, DEFAULT_SCALE_LABELS, ScaleLabel, Question } from '@/types/database'

interface SurveyFormProps {
  sessionId: string
  dimensions: DimensionWithQuestions[]
  scaleLabels?: ScaleLabel[] | null
  instrumentName?: string
  instrumentDescription?: string | null
  sessionName?: string
  totalDimensionsCount?: number
  totalQuestionsCount?: number
  estimatedMinutes?: number
}

export default function SurveyForm({
  sessionId,
  dimensions,
  scaleLabels,
  instrumentName = 'Evaluación',
  instrumentDescription,
  sessionName,
  totalDimensionsCount,
  totalQuestionsCount,
  estimatedMinutes,
}: SurveyFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const scale = scaleLabels && scaleLabels.length > 0
    ? scaleLabels.sort((a, b) => b.value - a.value)
    : DEFAULT_SCALE_LABELS

  const [step, setStep] = useState<'landing' | 'register' | 'survey' | 'submitting'>('landing')
  const [currentDimension, setCurrentDimension] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [textResponses, setTextResponses] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [respondentId, setRespondentId] = useState<string | null>(null)

  const totalDimensions = dimensions.length

  // === HANDLERS ===

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim()) {
      setError('Nombre y correo son obligatorios')
      return
    }

    if (name.trim().length < 2 || name.trim().length > 100) {
      setError('El nombre debe tener entre 2 y 100 caracteres')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Formato de correo inválido')
      return
    }

    try {
      const res = await fetch('/api/respondents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, name: name.trim(), email: email.trim() }),
      })

      if (res.status === 429) {
        setError('Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.')
        return
      }

      const result = await res.json()

      if (!res.ok) {
        if (result.code === 'ALREADY_COMPLETED') {
          setError('Ya respondiste esta encuesta. Tu evaluación fue registrada exitosamente.')
          return
        }
        setError(result.error || 'Error al registrar. Intenta de nuevo.')
        return
      }

      setRespondentId(result.id)

      if (result.resumed) {
        const { data: prevResponses } = await supabase
          .from('responses')
          .select('question_id, value, text_value')
          .eq('respondent_id', result.id)

        if (prevResponses && prevResponses.length > 0) {
          const prevMap: Record<string, number> = {}
          const prevTextMap: Record<string, string> = {}
          prevResponses.forEach(r => {
            if (r.value !== null) prevMap[r.question_id] = r.value
            if (r.text_value) prevTextMap[r.question_id] = r.text_value
          })
          setResponses(prevMap)
          setTextResponses(prevTextMap)
        }
      }

      setStep('survey')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    }
  }

  function selectValue(questionId: string, value: number) {
    setResponses(prev => ({ ...prev, [questionId]: value }))
  }

  function setTextResponse(questionId: string, text: string) {
    setTextResponses(prev => ({ ...prev, [questionId]: text }))
  }

  function isQuestionAnswered(question: Question): boolean {
    const type = question.type || 'likert'
    if (type === 'text') {
      // Texto libre: obligatorio solo si is_required
      if (!question.is_required) return true
      return (textResponses[question.id] || '').trim().length > 0
    }
    // Likert y Boolean: verificar que haya valor numérico
    if (!question.is_required) return true
    return responses[question.id] !== undefined
  }

  function allRequiredAnswered(dimensionIndex: number): boolean {
    const dim = dimensions[dimensionIndex]
    return dim.questions.every(q => isQuestionAnswered(q))
  }

  function nextDimension() {
    if (!allRequiredAnswered(currentDimension)) {
      setError('Responde todas las preguntas obligatorias antes de continuar')
      return
    }
    setError('')
    if (currentDimension < totalDimensions - 1) {
      setCurrentDimension(prev => prev + 1)
    }
  }

  function prevDimension() {
    setError('')
    if (currentDimension > 0) {
      setCurrentDimension(prev => prev - 1)
    }
  }

  async function handleSubmit() {
    if (!allRequiredAnswered(currentDimension)) {
      setError('Responde todas las preguntas obligatorias antes de enviar')
      return
    }

    setStep('submitting')
    setError('')

    // Construir array de respuestas (numéricas + texto)
    const responsesArray: { respondent_id: string; question_id: string; value: number | null; text_value: string | null }[] = []

    dimensions.forEach(dim => {
      dim.questions.forEach(q => {
        const type = q.type || 'likert'
        if (type === 'text') {
          const textVal = textResponses[q.id]
          if (textVal && textVal.trim()) {
            responsesArray.push({
              respondent_id: respondentId!,
              question_id: q.id,
              value: null,
              text_value: textVal.trim(),
            })
          }
        } else {
          const numVal = responses[q.id]
          if (numVal !== undefined) {
            responsesArray.push({
              respondent_id: respondentId!,
              question_id: q.id,
              value: numVal,
              text_value: null,
            })
          }
        }
      })
    })

    const { error: insertError } = await supabase
      .from('responses')
      .upsert(responsesArray, { onConflict: 'respondent_id,question_id' })

    if (insertError) {
      setError('Error al guardar respuestas. Intenta de nuevo.')
      setStep('survey')
      return
    }

    await supabase
      .from('respondents')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', respondentId!)

    router.push(`/resultados/${respondentId}`)
  }

  // === RENDERS ===

  // === LANDING PAGE ===
  if (step === 'landing') {
    return (
      <div className="max-w-lg mx-auto text-center">
        <img src="/logo-gbm.png" alt="GBM" className="h-10 mx-auto mb-6" />

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          {instrumentName}
        </h1>

        {instrumentDescription && (
          <p className="text-gray-600 mb-6">{instrumentDescription}</p>
        )}

        <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm text-gray-500">
          {totalDimensionsCount && (
            <span className="flex items-center gap-1">📋 {totalDimensionsCount} dimensiones</span>
          )}
          {totalQuestionsCount && (
            <span className="flex items-center gap-1">❓ {totalQuestionsCount} preguntas</span>
          )}
          {estimatedMinutes && (
            <span className="flex items-center gap-1">⏱️ ~{estimatedMinutes} minutos</span>
          )}
        </div>

        {sessionName && (
          <p className="text-sm text-gray-400 mb-6">Sesión: {sessionName}</p>
        )}

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-start gap-3 text-left text-sm text-gray-600">
            <span className="text-lg">📊</span>
            <p>Al finalizar verás tus resultados inmediatamente con un gráfico de radar y tu nivel de madurez por dimensión.</p>
          </div>
        </div>

        <button
          onClick={() => setStep('register')}
          className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
        >
          Comenzar Evaluación →
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Tus respuestas son confidenciales. Solo el administrador de la sesión puede ver los resultados.
        </p>
      </div>
    )
  }

  // === REGISTRO ===
  if (step === 'register') {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <img src="/logo-gbm.png" alt="GBM" className="h-8 mx-auto mb-3" />
          <h2 className="text-2xl font-bold">Registro</h2>
          <p className="text-gray-600 text-sm mt-1">Ingresa tus datos para comenzar</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tu nombre"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tu@correo.com"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continuar
          </button>
          <button
            type="button"
            onClick={() => setStep('landing')}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            ← Volver
          </button>
        </form>
      </div>
    )
  }

  // === ENVIANDO ===
  if (step === 'submitting') {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Guardando respuestas...</p>
      </div>
    )
  }

  // === WIZARD ===
  if (dimensions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium">No se encontraron dimensiones para esta evaluación.</p>
      </div>
    )
  }

  const currentDim = dimensions[currentDimension]
  if (!currentDim) return null
  const isLastStep = currentDimension === totalDimensions - 1
  const dimColor = currentDim.color || '#2563EB'

  // Verificar si la dimensión tiene preguntas Likert (para mostrar la leyenda de escala)
  const hasLikertQuestions = currentDim.questions.some(q => (q.type || 'likert') === 'likert')

  return (
    <div className="max-w-3xl mx-auto">
      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Dimensión {currentDimension + 1} de {totalDimensions}</span>
          <span>{Math.round(((currentDimension + 1) / totalDimensions) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            role="progressbar"
            aria-valuenow={currentDimension + 1}
            aria-valuemin={1}
            aria-valuemax={totalDimensions}
            aria-label={`Progreso: dimensión ${currentDimension + 1} de ${totalDimensions}`}
            className="h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentDimension + 1) / totalDimensions) * 100}%`, backgroundColor: dimColor }}
          />
        </div>
      </div>

      {/* Dimensión actual */}
      <div className="bg-white rounded-xl shadow-sm border-l-4 p-6 mb-6" style={{ borderLeftColor: dimColor }}>
        <h3 className="text-xl font-bold mb-1" style={{ color: dimColor }}>
          {currentDimension + 1}. {currentDim.name}
        </h3>
        {currentDim.description && (
          <p className="text-gray-500 text-sm mb-6">{currentDim.description}</p>
        )}

        {/* Leyenda de escala (solo si hay preguntas Likert) */}
        {hasLikertQuestions && (
          <div className="flex flex-wrap gap-2 mb-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            {scale.map(({ value, label }) => (
              <span key={value} className="whitespace-nowrap">
                <strong>{value}</strong> = {label}
              </span>
            ))}
          </div>
        )}

        {/* Preguntas */}
        <div className="space-y-6">
          {currentDim.questions.map((question, idx) => {
            const qType = question.type || 'likert'
            const isOptional = !question.is_required

            return (
              <div key={question.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                <p className="text-sm text-gray-800 mb-3">
                  <span className="font-medium text-gray-500">{idx + 1}.</span>{' '}
                  {question.text}
                  {isOptional && <span className="text-gray-400 text-xs ml-2">(opcional)</span>}
                </p>

                {/* Likert: botones 1-5 */}
                {qType === 'likert' && (
                  <div className="flex gap-2">
                    {scale.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => selectValue(question.id, value)}
                        title={`${value} — ${label}`}
                        aria-label={`Valor ${value}: ${label}`}
                        aria-pressed={responses[question.id] === value}
                        className={`w-10 h-10 rounded-lg border text-sm font-bold transition-all ${
                          responses[question.id] === value
                            ? 'text-white'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700'
                        }`}
                        style={responses[question.id] === value ? { backgroundColor: dimColor, borderColor: dimColor } : {}}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                )}

                {/* Boolean: Sí / No */}
                {qType === 'boolean' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => selectValue(question.id, 1)}
                      aria-label="Sí"
                      aria-pressed={responses[question.id] === 1}
                      className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                        responses[question.id] === 1
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-gray-300 hover:border-green-400 hover:bg-green-50 text-gray-700'
                      }`}
                    >
                      ✓ Sí
                    </button>
                    <button
                      onClick={() => selectValue(question.id, 0)}
                      aria-label="No"
                      aria-pressed={responses[question.id] === 0}
                      className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                        responses[question.id] === 0
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'border-gray-300 hover:border-red-400 hover:bg-red-50 text-gray-700'
                      }`}
                    >
                      ✗ No
                    </button>
                  </div>
                )}

                {/* Texto libre */}
                {qType === 'text' && (
                  <textarea
                    value={textResponses[question.id] || ''}
                    onChange={e => setTextResponse(question.id, e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    maxLength={500}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Navegación */}
      {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
      <div className="flex justify-between">
        <button
          onClick={prevDimension}
          disabled={currentDimension === 0}
          className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Anterior
        </button>
        {isLastStep ? (
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
          >
            Enviar Evaluación ✓
          </button>
        ) : (
          <button
            onClick={nextDimension}
            className="px-6 py-2 rounded-lg text-white transition-colors font-medium"
            style={{ backgroundColor: dimColor }}
          >
            Siguiente →
          </button>
        )}
      </div>
    </div>
  )
}
