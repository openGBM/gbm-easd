'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DimensionWithQuestions, AGREEMENT_SCALE, ScaleLabel } from '@/types/database'

interface SurveyFormProps {
  sessionId: string
  dimensions: DimensionWithQuestions[]
  scaleLabels?: ScaleLabel[] | null
}

export default function SurveyForm({ sessionId, dimensions, scaleLabels }: SurveyFormProps) {
  const router = useRouter()
  const supabase = createClient()

  // Usar etiquetas personalizadas si existen, sino las default
  const scale = scaleLabels && scaleLabels.length > 0
    ? scaleLabels.sort((a, b) => b.value - a.value)
    : AGREEMENT_SCALE

  const [step, setStep] = useState<'register' | 'survey' | 'submitting'>('register')
  const [currentDimension, setCurrentDimension] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  // responses: { questionId: value }
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [error, setError] = useState('')
  const [respondentId, setRespondentId] = useState<string | null>(null)

  const totalDimensions = dimensions.length

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

    const { data, error: dbError } = await supabase
      .from('respondents')
      .insert({ session_id: sessionId, name: name.trim(), email: email.trim() })
      .select('id')
      .single()

    if (dbError) {
      if (dbError.code === '23505') {
        // Email ya registrado — verificar si completó o no
        const { data: existing } = await supabase
          .from('respondents')
          .select('id, completed')
          .eq('session_id', sessionId)
          .eq('email', email.trim())
          .single()

        if (existing?.completed) {
          setError('Ya respondiste esta encuesta. Tu evaluación fue registrada exitosamente.')
          return
        }

        if (existing) {
          // No completó — cargar respuestas previas y permitir continuar
          setRespondentId(existing.id)

          // Cargar respuestas existentes
          const { data: prevResponses } = await supabase
            .from('responses')
            .select('question_id, value')
            .eq('respondent_id', existing.id)

          if (prevResponses && prevResponses.length > 0) {
            const prevMap: Record<string, number> = {}
            prevResponses.forEach(r => { prevMap[r.question_id] = r.value })
            setResponses(prevMap)
          }

          setStep('survey')
          return
        }

        setError('Ya existe un registro con este correo para esta sesión')
      } else {
        setError('Error al registrar. Intenta de nuevo.')
      }
      return
    }

    setRespondentId(data.id)
    setStep('survey')
  }

  function selectValue(questionId: string, value: number) {
    setResponses(prev => ({ ...prev, [questionId]: value }))
  }

  function allQuestionsAnswered(dimensionIndex: number): boolean {
    const dim = dimensions[dimensionIndex]
    return dim.questions.every(q => responses[q.id] !== undefined)
  }

  function nextDimension() {
    if (!allQuestionsAnswered(currentDimension)) {
      setError('Responde todas las preguntas antes de continuar')
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
    if (!allQuestionsAnswered(currentDimension)) {
      setError('Responde todas las preguntas antes de enviar')
      return
    }

    setStep('submitting')
    setError('')

    const responsesArray = Object.entries(responses).map(([question_id, value]) => ({
      respondent_id: respondentId!,
      question_id,
      value,
    }))

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

    // Fallback: si el update anterior falló por columna inexistente, intentar sin completed_at
    const { data: checkData } = await supabase
      .from('respondents')
      .select('completed')
      .eq('id', respondentId!)
      .single()

    if (checkData && !checkData.completed) {
      await supabase
        .from('respondents')
        .update({ completed: true })
        .eq('id', respondentId!)
    }

    router.push(`/resultados/${respondentId}`)
  }

  // === REGISTRO ===
  if (step === 'register') {
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Registro</h2>
        <p className="text-gray-600 mb-6 text-center">
          Ingresa tus datos para comenzar la evaluación de madurez
        </p>
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
            Comenzar Evaluación
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
  const currentDim = dimensions[currentDimension]
  const isLastStep = currentDimension === totalDimensions - 1
  const dimColor = currentDim.color || '#2563EB'

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

        {/* Leyenda de escala */}
        <div className="flex flex-wrap gap-2 mb-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          {scale.map(({ value, label }) => (
            <span key={value} className="whitespace-nowrap">
              <strong>{value}</strong> = {label}
            </span>
          ))}
        </div>

        {/* Preguntas de esta dimensión */}
        <div className="space-y-6">
          {currentDim.questions.map((question, idx) => {
            const selectedValue = responses[question.id]
            return (
              <div key={question.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                <p className="text-sm text-gray-800 mb-3">
                  <span className="font-medium text-gray-500">{idx + 1}.</span>{' '}
                  {question.text}
                </p>
                <div className="flex gap-2">
                  {scale.map(({ value }) => (
                    <button
                      key={value}
                      onClick={() => selectValue(question.id, value)}
                      className={`w-10 h-10 rounded-lg border text-sm font-bold transition-all ${
                        selectedValue === value
                          ? 'text-white'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700'
                      }`}
                      style={selectedValue === value ? { backgroundColor: dimColor, borderColor: dimColor } : {}}
                    >
                      {value}
                    </button>
                  ))}
                </div>
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
