'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { transformTrendData, RawTrendRow, TrendDataPoint, DimensionInfo } from '@/lib/analytics/transformTrendData'
import { filterTrendData, TrendFilterState } from '@/lib/analytics/filterTrendData'
import TrendBarChart from '@/components/TrendBarChart'
import TrendTable from '@/components/TrendTable'
import TrendFilters from '@/components/TrendFilters'
import Link from 'next/link'

export default function TendenciasPage() {
  const params = useParams()
  const router = useRouter()
  const instrumentId = params.id as string
  const supabase = createClient()

  const [instrumentName, setInstrumentName] = useState('')
  const [loading, setLoading] = useState(true)
  const [allDataPoints, setAllDataPoints] = useState<TrendDataPoint[]>([])
  const [filteredData, setFilteredData] = useState<TrendDataPoint[]>([])
  const [dimensions, setDimensions] = useState<DimensionInfo[]>([])
  const [sessionOptions, setSessionOptions] = useState<{ id: string; name: string; date: string }[]>([])

  // Filtros
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())

  useEffect(() => {
    checkAuthAndLoad()
  }, [instrumentId])

  useEffect(() => {
    const filters: TrendFilterState = { dateFrom, dateTo, selectedSessions }
    setFilteredData(filterTrendData(allDataPoints, filters))
  }, [allDataPoints, dateFrom, dateTo, selectedSessions])

  async function checkAuthAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }
    await loadData()
  }

  async function loadData() {
    // Cargar info del instrumento
    const { data: instrument } = await supabase
      .from('instruments')
      .select('name')
      .eq('id', instrumentId)
      .single()

    if (!instrument) {
      setLoading(false)
      return
    }
    setInstrumentName(instrument.name)

    // Obtener la versión actual del instrumento
    const { data: version } = await supabase
      .from('instrument_versions')
      .select('id')
      .eq('instrument_id', instrumentId)
      .eq('is_current', true)
      .single()

    if (!version) {
      setLoading(false)
      return
    }

    // Cargar sesiones de este instrumento (por instrument_version_id)
    // También incluye versiones anteriores del mismo instrumento
    const { data: versions } = await supabase
      .from('instrument_versions')
      .select('id')
      .eq('instrument_id', instrumentId)

    const versionIds = versions?.map(v => v.id) || []

    if (versionIds.length === 0) {
      setLoading(false)
      return
    }

    // Cargar datos de tendencia: promedio por dimensión por sesión
    const { data: rawData } = await supabase
      .from('sessions')
      .select(`
        id,
        name,
        created_at,
        instrument_version_id,
        respondents!inner (
          id,
          completed,
          responses (
            value,
            questions (
              dimension_id,
              dimensions (
                name,
                display_order,
                color
              )
            )
          )
        )
      `)
      .in('instrument_version_id', versionIds)
      .order('created_at', { ascending: true })

    if (!rawData || rawData.length === 0) {
      setLoading(false)
      return
    }

    // Transformar a formato plano para el transformer
    const flatRows: RawTrendRow[] = []

    rawData.forEach((session: any) => {
      const dimScores: Record<string, { total: number; count: number; name: string; order: number; color: string | null }> = {}

      session.respondents
        .filter((r: any) => r.completed)
        .forEach((respondent: any) => {
          respondent.responses?.forEach((response: any) => {
            const dim = response.questions?.dimensions
            if (!dim) return
            const key = dim.name
            if (!dimScores[key]) {
              dimScores[key] = { total: 0, count: 0, name: dim.name, order: dim.display_order, color: dim.color }
            }
            dimScores[key].total += response.value
            dimScores[key].count += 1
          })
        })

      Object.values(dimScores).forEach(dimData => {
        if (dimData.count > 0) {
          flatRows.push({
            session_id: session.id,
            session_name: session.name,
            session_date: session.created_at,
            dimension_name: dimData.name,
            dimension_order: dimData.order,
            dimension_color: dimData.color,
            avg_value: dimData.total / dimData.count,
          })
        }
      })
    })

    const result = transformTrendData(flatRows)
    setAllDataPoints(result.dataPoints)
    setDimensions(result.dimensions)
    setSessionOptions(result.dataPoints.map(p => ({ id: p.sessionId, name: p.sessionName, date: p.sessionDate })))
    setFilteredData(result.dataPoints)
    setLoading(false)
  }

  function handleSessionToggle(sessionId: string) {
    setSelectedSessions(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  function handleSelectAll() {
    setSelectedSessions(new Set(sessionOptions.map(s => s.id)))
  }

  function handleClearAll() {
    setSelectedSessions(new Set())
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Cargando tendencias...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-blue-600 hover:text-blue-700">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          📊 Tendencias — {instrumentName}
        </h1>
      </div>

      {allDataPoints.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
          <p className="text-lg mb-2">No hay datos de tendencia disponibles</p>
          <p className="text-sm">Se necesitan sesiones con encuestados completados para generar tendencias.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filtros */}
          <div className="lg:col-span-1">
            <TrendFilters
              sessions={sessionOptions}
              dateFrom={dateFrom}
              dateTo={dateTo}
              selectedSessions={selectedSessions}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onSessionToggle={handleSessionToggle}
              onSelectAll={handleSelectAll}
              onClearAll={handleClearAll}
            />
          </div>

          {/* Gráficos y tabla */}
          <div className="lg:col-span-3 space-y-6">
            {/* Gráfico: Promedio General */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Promedio General por Sesión</h2>
              <TrendBarChart data={filteredData} type="general" />
            </div>

            {/* Gráfico: Por Dimensión */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Promedio por Dimensión</h2>
              <TrendBarChart data={filteredData} type="byDimension" dimensions={dimensions} />
            </div>

            {/* Tabla de datos */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Datos</h2>
              <TrendTable data={filteredData} dimensions={dimensions} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
