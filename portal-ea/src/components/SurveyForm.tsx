'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dimension, AGREEMENT_SCALE } from '@/types/database'

interface SurveyFormProps {
  sessionId: string
  dimensions: Dimension[]
}

export default function SurveyForm({ sessionId, dimensions }: SurveyFormProps) {
  const router = useRouter()
  const supabase = createClient()

  // Estado del formulario
  const [step, setStep] = useState<'register' | 'survey' | 'submitting'>('register')
  const [currentDimension, setCurrentDimension] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [error, setError] = useState('')
  const [respondentId, setRespondentId] = useState<string | null>(null)

  const totalDimensions = dimensions.length

  // Registro del encuestado
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim()) {
      setError('Nombre y correo son obligatorios')
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
        setError('Ya existe un registro con este correo para esta sesión')
      } else {
        setError('Error al registrar. Intenta de nuevo.')
      }
      return
    }

    setRespondentId(data.id)
    setStep('survey')
  }

  // Seleccionar valor para dimensión actual
  function selectValue(value: number) {
    const dimensionId = dimensions[currentDimension].id
    setResponses(prev => ({ ...prev, [dimensionId]: value }))
  }

  // Navegar al siguiente paso
  function nextStep() {
    const dimensionId = dimensions[currentDimension].id
    if (!responses[dimensionId]) {
      setError('Selecciona un valor antes de continuar')
      return
    }
    setError('')
    if (currentDimension < totalDimensions - 1) {
      setCurrentDimension(prev => prev + 1)
    }
  }

  // Navegar al paso anterior
  function prevStep() {
    setError('')
    if (currentDimension > 0) {
      setCurrentDimension(prev => prev - 1)
    }
  }

  // Enviar todas las respuestas
  async function handleSubmit() {
    const dimensionId = dimensions[currentDimension].id
    if (!responses[dimensionId]) {
      setError('Selecciona un valor antes de enviar')
      return
    }

    setStep('submitting')
    setError('')

    const responsesArray = Object.entries(responses).map(([dimension_id, value]) => ({
      respondent_id: respondentId!,
      dimension_id,
      value,
    }))

    const { error: insertError } = await supabase
      .from('responses')
      .insert(responsesArray)

    if (insertError) {
      setError('Error al guardar respuestas. Intenta de nuevo.')
      setStep('survey')
      return
    }

    // Marcar como completado
    await supabase
      .from('respondents')
      .update({ completed: true })
      .eq('id', respondentId!)

    router.push(`/resultados/${respondentId}`)
  }

  // Paso de registro
  if (step === 'register') {
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Registro</h2>
        <p className="text-gray-600 mb-6 text-center">
          Ingresa tus datos para comenzar la evaluación
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

  // Enviando...
  if (step === 'submitting') {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Guardando respuestas...</p>
      </div>
    )
  }

  // Wizard de encuesta
  const currentDim = dimensions[currentDimension]
  const currentValue = responses[currentDim.id] || 0
  const isLastStep = currentDimension === totalDimensions - 1

  return (
    <div className="max-w-lg mx-auto">
      {/* Barra de progreso */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Dimensión {currentDimension + 1} de {totalDimensions}</span>
          <span>{Math.round(((currentDimension + 1) / totalDimensions) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentDimension + 1) / totalDimensions) * 100}%` }}
          />
        </div>
      </div>

      {/* Dimensión actual */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h3 className="text-xl font-bold mb-2">{currentDim.name}</h3>
        {currentDim.description && (
          <p className="text-gray-600 mb-6">{currentDim.description}</p>
        )}

        {/* Escala de acuerdo */}
        <div className="space-y-3">
          {AGREEMENT_SCALE.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => selectValue(value)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                currentValue === value
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="font-mono mr-3">{value}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Navegación */}
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
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
            Enviar ✓
          </button>
        ) : (
          <button
            onClick={nextStep}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
          >
            Siguiente →
          </button>
        )}
      </div>
    </div>
  )
}
