'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Session, Respondent } from '@/types/database'
import RadarChart from '@/components/RadarChart'
import ResultsTable from '@/components/ResultsTable'
import Link from 'next/link'

export default function SessionDetailPage() {
  const params = useParams()
  const sessionId = params.id as string
  const supabase = createClient()

  const [session, setSession] = useState<Session | null>(null)
  const [respondents, setRespondents] = useState<Respondent[]>([])
  const [selectedRespondent, setSelectedRespondent] = useState<string | null>(null)
  const [chartData, setChartData] = useState<{ dimension: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSession()
  }, [sessionId])

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
      .select('*, dimensions(*)')
      .eq('respondent_id', respondentId)
      .order('created_at', { ascending: true })

    if (responses) {
      const formatted = responses
        .sort((a: any, b: any) => a.dimensions.display_order - b.dimensions.display_order)
        .map((r: any) => ({
          dimension: r.dimensions.name,
          value: r.value,
        }))
      setChartData(formatted)
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
            <h2 className="font-bold text-gray-900 mb-4">
              Encuestados ({respondents.length})
            </h2>
            {respondents.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no hay encuestados.</p>
            ) : (
              <div className="space-y-2">
                {respondents.map(r => (
                  <button
                    key={r.id}
                    onClick={() => viewResponses(r.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedRespondent === r.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
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
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resultados del encuestado seleccionado */}
        <div className="lg:col-span-2">
          {selectedRespondent && chartData.length > 0 ? (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-bold mb-4 text-center">Gráfico de Radar</h2>
                <RadarChart data={chartData} />
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-bold mb-4 text-center">Resumen</h2>
                <ResultsTable data={chartData} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
              <p>Selecciona un encuestado para ver sus resultados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
