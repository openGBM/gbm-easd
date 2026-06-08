'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Session, Respondent } from '@/types/database'
import RadarChart from '@/components/RadarChart'
import ResultsTable from '@/components/ResultsTable'
import Link from 'next/link'

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const supabase = createClient()

  const [session, setSession] = useState<Session | null>(null)
  const [respondents, setRespondents] = useState<Respondent[]>([])
  const [selectedRespondent, setSelectedRespondent] = useState<string | null>(null)
  const [chartData, setChartData] = useState<{ dimension: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'individual' | 'consolidated'>('individual')

  useEffect(() => {
    checkAuthAndLoad()
  }, [sessionId])

  async function checkAuthAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }
    loadSession()
  }

  async function loadSession() {
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionData) setSession(sessionData)

    const { data: respondentData } = await supabase
      .from('respondents')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (respondentData) setRespondents(respondentData)
    setLoading(false)
  }

  async function viewResponses(respondentId: string) {
    setSelectedRespondent(respondentId)

    const { data: responses } = await supabase
      .from('responses')
      .select('*, questions(*, dimensions(*))')
      .eq('respondent_id', respondentId)

    if (responses && responses.length > 0) {
      // Calcular promedio por dimensión
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

      const formatted = Object.values(dimensionScores)
        .sort((a, b) => a.order - b.order)
        .map(d => ({
          dimension: d.name,
          value: Math.round((d.total / d.count) * 10) / 10,
        }))
      setChartData(formatted)
    } else {
      setChartData([])
    }
  }

  async function deleteRespondent(respondentId: string) {
    if (!confirm('¿Eliminar este encuestado y todas sus respuestas?')) return

    // Primero eliminar respuestas
    await supabase.from('responses').delete().eq('respondent_id', respondentId)
    // Luego eliminar encuestado
    await supabase.from('respondents').delete().eq('id', respondentId)

    if (selectedRespondent === respondentId) {
      setSelectedRespondent(null)
      setChartData([])
    }
    await loadSession()
  }

  async function loadConsolidated() {
    setViewMode('consolidated')
    setSelectedRespondent(null)

    // Obtener IDs de encuestados completados
    const completedRespondents = respondents.filter(r => r.completed)
    if (completedRespondents.length === 0) {
      setChartData([])
      return
    }

    const ids = completedRespondents.map(r => r.id)

    const { data: allResponses } = await supabase
      .from('responses')
      .select('*, questions(*, dimensions(*))')
      .in('respondent_id', ids)

    if (allResponses && allResponses.length > 0) {
      const dimensionScores: Record<string, { name: string; total: number; count: number; order: number }> = {}

      allResponses.forEach((r: any) => {
        const dimId = r.questions.dimensions.id
        const dimName = r.questions.dimensions.name
        const dimOrder = r.questions.dimensions.display_order

        if (!dimensionScores[dimId]) {
          dimensionScores[dimId] = { name: dimName, total: 0, count: 0, order: dimOrder }
        }
        dimensionScores[dimId].total += r.value
        dimensionScores[dimId].count += 1
      })

      const formatted = Object.values(dimensionScores)
        .sort((a, b) => a.order - b.order)
        .map(d => ({
          dimension: d.name,
          value: Math.round((d.total / d.count) * 10) / 10,
        }))
      setChartData(formatted)
    } else {
      setChartData([])
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  if (!session) {
    return <p className="text-red-600">Sesión no encontrada</p>
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-blue-600 hover:text-blue-700">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          session.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {session.is_active ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Lista de encuestados */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">
                Encuestados ({respondents.length})
              </h2>
            </div>

            {/* Botón consolidado */}
            {respondents.filter(r => r.completed).length > 0 && (
              <button
                onClick={loadConsolidated}
                className={`w-full mb-4 p-3 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'consolidated'
                    ? 'bg-indigo-100 border border-indigo-300 text-indigo-700'
                    : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                📊 Vista Consolidada ({respondents.filter(r => r.completed).length} respuestas)
              </button>
            )}

            {respondents.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no hay encuestados.</p>
            ) : (
              <div className="space-y-2">
                {respondents.map(r => (
                  <div
                    key={r.id}
                    className={`p-3 rounded-lg transition-colors ${
                      selectedRespondent === r.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => { setViewMode('individual'); viewResponses(r.id) }}
                      className="w-full text-left"
                    >
                      <p className="font-medium text-sm text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs ${r.completed ? 'text-green-600' : 'text-yellow-600'}`}>
                          {r.completed ? '✓ Completado' : '⏳ Pendiente'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => deleteRespondent(r.id)}
                      className="mt-2 text-xs text-red-500 hover:text-red-700 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2">
          {chartData.length > 0 ? (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-bold mb-1 text-center">
                  {viewMode === 'consolidated'
                    ? 'Resultados Consolidados'
                    : `Resultados — ${respondents.find(r => r.id === selectedRespondent)?.name || ''}`
                  }
                </h2>
                {viewMode === 'consolidated' && (
                  <p className="text-sm text-gray-500 text-center mb-4">
                    Promedio de {respondents.filter(r => r.completed).length} encuestado(s) completado(s)
                  </p>
                )}
                <RadarChart data={chartData} />
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-bold mb-4 text-center">Resumen</h2>
                <ResultsTable data={chartData} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
              <p>Selecciona un encuestado o usa la vista consolidada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
