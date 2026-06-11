'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { transformRespondentHistory, RawHistoryRow, RespondentSession, RespondentRadarData } from '@/lib/analytics/transformRespondentHistory'
import RespondentSearchBar from '@/components/RespondentSearchBar'
import RespondentHistoryTable from '@/components/RespondentHistoryTable'
import RespondentRadarGrid from '@/components/RespondentRadarGrid'
import Link from 'next/link'

interface SearchResult {
  email: string
  name: string
  sessionCount: number
}

export default function EncuestadosPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState('')
  const [historyTable, setHistoryTable] = useState<RespondentSession[]>([])
  const [historyRadars, setHistoryRadars] = useState<RespondentRadarData[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
    }
  }

  async function handleSearch(query: string) {
    setLoading(true)
    setHasSearched(true)
    setSelectedEmail(null)
    setHistoryTable([])
    setHistoryRadars([])

    // Buscar encuestados por email o nombre
    const { data } = await supabase
      .from('respondents')
      .select('email, name, session_id')
      .eq('completed', true)
      .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
      .order('email')

    if (data && data.length > 0) {
      // Agrupar por email y contar sesiones
      const emailMap = new Map<string, { name: string; sessions: Set<string> }>()
      data.forEach(row => {
        if (!emailMap.has(row.email)) {
          emailMap.set(row.email, { name: row.name, sessions: new Set() })
        }
        emailMap.get(row.email)!.sessions.add(row.session_id)
      })

      const results: SearchResult[] = Array.from(emailMap.entries()).map(([email, info]) => ({
        email,
        name: info.name,
        sessionCount: info.sessions.size,
      }))

      setSearchResults(results)
    } else {
      setSearchResults([])
    }

    setLoading(false)
  }

  async function selectRespondent(email: string, name: string) {
    setSelectedEmail(email)
    setSelectedName(name)
    setLoadingHistory(true)

    // Cargar historial completo del encuestado
    const { data: respondents } = await supabase
      .from('respondents')
      .select('id, session_id, sessions(id, name, created_at, instrument_version_id)')
      .eq('email', email)
      .eq('completed', true)
      .order('created_at', { ascending: true })

    if (!respondents || respondents.length === 0) {
      setHistoryTable([])
      setHistoryRadars([])
      setLoadingHistory(false)
      return
    }

    // Para cada participación, cargar respuestas con dimensiones
    const allRows: RawHistoryRow[] = []

    for (const resp of respondents) {
      const session = (resp as any).sessions
      if (!session) continue

      // Cargar info del instrumento si existe
      let instrumentName: string | undefined
      let versionTag: string | undefined
      if (session.instrument_version_id) {
        const { data: versionData } = await supabase
          .from('instrument_versions')
          .select('version_tag, instruments(name)')
          .eq('id', session.instrument_version_id)
          .single()
        if (versionData) {
          versionTag = versionData.version_tag
          instrumentName = (versionData as any).instruments?.name
        }
      }

      const { data: responses } = await supabase
        .from('responses')
        .select('value, questions(dimension_id, dimensions(name, display_order, color))')
        .eq('respondent_id', resp.id)

      if (!responses) continue

      // Agrupar por dimensión
      const dimScores: Record<string, { total: number; count: number; name: string; order: number; color: string | null }> = {}

      responses.forEach((r: any) => {
        const dim = r.questions?.dimensions
        if (!dim) return
        const key = dim.name
        if (!dimScores[key]) {
          dimScores[key] = { total: 0, count: 0, name: dim.name, order: dim.display_order, color: dim.color }
        }
        dimScores[key].total += r.value
        dimScores[key].count += 1
      })

      Object.values(dimScores).forEach(dimData => {
        if (dimData.count > 0) {
          allRows.push({
            session_id: session.id,
            session_name: session.name,
            session_date: session.created_at,
            dimension_name: dimData.name,
            dimension_order: dimData.order,
            dimension_color: dimData.color,
            avg_value: dimData.total / dimData.count,
            total_value: dimData.total,
            question_count: dimData.count,
            instrument_name: instrumentName,
            version_tag: versionTag,
          })
        }
      })
    }

    const result = transformRespondentHistory(allRows)
    setHistoryTable(result.table)
    setHistoryRadars(result.radars)
    setLoadingHistory(false)
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-blue-600 hover:text-blue-700">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          👤 Historial de Encuestados
        </h1>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <p className="text-sm text-gray-500 mb-4">
          Busca un encuestado por email o nombre para ver su historial de participación en todas las sesiones.
        </p>
        <RespondentSearchBar onSearch={handleSearch} loading={loading} />
      </div>

      {/* Resultados de búsqueda */}
      {hasSearched && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lista de resultados */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h2 className="font-bold text-gray-900 mb-4">
                Resultados ({searchResults.length})
              </h2>

              {searchResults.length === 0 ? (
                <p className="text-sm text-gray-500">No se encontraron encuestados.</p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map(result => (
                    <button
                      key={result.email}
                      onClick={() => selectRespondent(result.email, result.name)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedEmail === result.email
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900">{result.name}</p>
                      <p className="text-xs text-gray-500">{result.email}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {result.sessionCount} sesión(es) completada(s)
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Historial del encuestado seleccionado */}
          <div className="lg:col-span-2">
            {loadingHistory ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Cargando historial...</p>
              </div>
            ) : selectedEmail ? (
              <div className="space-y-6">
                {/* Info del encuestado */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    {selectedName}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedEmail}</p>
                </div>

                {/* Tabla cronológica */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Historial de Participaciones</h3>
                  <RespondentHistoryTable history={historyTable} />
                </div>

                {/* Radares independientes */}
                {historyRadars.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Resultados por Sesión</h3>
                    <RespondentRadarGrid sessions={historyRadars} />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
                <p>Selecciona un encuestado para ver su historial.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
