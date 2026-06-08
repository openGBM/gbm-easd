'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Session, Respondent } from '@/types/database'
import RadarChart from '@/components/RadarChart'
import ResultsTable from '@/components/ResultsTable'
import Link from 'next/link'
import * as ExcelJS from 'exceljs'

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
  const [deletingSession, setDeletingSession] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [sessionStats, setSessionStats] = useState({ totalCompleted: 0, avgTimeMinutes: 0 })
  const [analysisText, setAnalysisText] = useState<string | null>(null)
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false)
  const [analysisError, setAnalysisError] = useState('')

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

    if (respondentData) {
      setRespondents(respondentData)

      // Calcular stats de la sesión
      const completed = respondentData.filter(r => r.completed)
      const withTime = completed.filter(r => r.completed_at)
      let avgTime = 0
      if (withTime.length > 0) {
        const totalMinutes = withTime.reduce((sum, r) => {
          const start = new Date(r.created_at).getTime()
          const end = new Date(r.completed_at!).getTime()
          return sum + (end - start) / 1000 / 60
        }, 0)
        avgTime = Math.round(totalMinutes / withTime.length)
      }
      setSessionStats({ totalCompleted: completed.length, avgTimeMinutes: avgTime })
    }

    // Cargar análisis existente si hay
    const { data: existingAnalysis } = await supabase
      .from('session_analyses')
      .select('analysis_text')
      .eq('session_id', sessionId)
      .single()

    if (existingAnalysis) {
      setAnalysisText(existingAnalysis.analysis_text)
    }

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

  async function deleteSession() {
    if (!session) return
    const confirmed = confirm(
      `¿Eliminar la sesión "${session.name}" y todos sus encuestados y respuestas?\n\nEsta acción no se puede deshacer.`
    )
    if (!confirmed) return

    setDeletingSession(true)

    // Eliminar respuestas de todos los encuestados
    if (respondents.length > 0) {
      const respondentIds = respondents.map(r => r.id)
      await supabase.from('responses').delete().in('respondent_id', respondentIds)
      await supabase.from('respondents').delete().eq('session_id', sessionId)
    }

    // Eliminar la sesión
    await supabase.from('sessions').delete().eq('id', sessionId)

    router.push('/admin')
  }

  async function exportToExcel() {
    setExporting(true)

    // Obtener encuestados completados
    const completedRespondents = respondents.filter(r => r.completed)
    if (completedRespondents.length === 0) {
      alert('No hay encuestados completados para exportar.')
      setExporting(false)
      return
    }

    const ids = completedRespondents.map(r => r.id)

    // Obtener todas las respuestas con dimensiones y preguntas
    const { data: allResponses } = await supabase
      .from('responses')
      .select('value, respondent_id, questions(text, display_order, dimensions(name, display_order))')
      .in('respondent_id', ids)

    if (!allResponses || allResponses.length === 0) {
      alert('No hay respuestas para exportar.')
      setExporting(false)
      return
    }

    // Obtener dimensiones ordenadas para las columnas
    const { data: dimensions } = await supabase
      .from('dimensions')
      .select('name, display_order')
      .order('display_order')

    // Construir filas: una fila por encuestado con sus respuestas agrupadas por dimensión
    const rows: Record<string, any>[] = []

    for (const respondent of completedRespondents) {
      const respondentResponses = allResponses.filter((r: any) => r.respondent_id === respondent.id)
      const row: Record<string, any> = {
        'Nombre': respondent.name,
        'Correo': respondent.email,
        'Fecha': new Date(respondent.created_at).toLocaleDateString('es-MX'),
      }

      // Calcular promedio por dimensión
      const dimScores: Record<string, { total: number; count: number }> = {}
      respondentResponses.forEach((r: any) => {
        const dimName = r.questions.dimensions.name
        if (!dimScores[dimName]) dimScores[dimName] = { total: 0, count: 0 }
        dimScores[dimName].total += r.value
        dimScores[dimName].count += 1
      })

      // Agregar promedio por dimensión como columna
      if (dimensions) {
        dimensions.forEach(dim => {
          const score = dimScores[dim.name]
          row[dim.name] = score ? Math.round((score.total / score.count) * 10) / 10 : 0
        })
      }

      // Total general
      const totalValues = respondentResponses.map((r: any) => r.value)
      row['Promedio General'] = totalValues.length > 0
        ? Math.round((totalValues.reduce((a: number, b: number) => a + b, 0) / totalValues.length) * 10) / 10
        : 0

      rows.push(row)
    }

    // Crear hoja de detalle (todas las respuestas individuales)
    const detailRows: Record<string, any>[] = []
    for (const respondent of completedRespondents) {
      const respondentResponses = allResponses
        .filter((r: any) => r.respondent_id === respondent.id)
        .sort((a: any, b: any) => {
          const dimDiff = a.questions.dimensions.display_order - b.questions.dimensions.display_order
          if (dimDiff !== 0) return dimDiff
          return a.questions.display_order - b.questions.display_order
        })

      respondentResponses.forEach((r: any) => {
        detailRows.push({
          'Nombre': respondent.name,
          'Correo': respondent.email,
          'Dimensión': r.questions.dimensions.name,
          'Pregunta': r.questions.text,
          'Valor': r.value,
        })
      })
    }

    // Generar archivo Excel con 2 hojas usando ExcelJS
    const wb = new ExcelJS.Workbook()

    // Hoja Resumen
    const wsResumen = wb.addWorksheet('Resumen')
    if (rows.length > 0) {
      wsResumen.columns = Object.keys(rows[0]).map(key => ({ header: key, key, width: 20 }))
      rows.forEach(row => wsResumen.addRow(row))
      // Estilo del encabezado
      wsResumen.getRow(1).font = { bold: true }
    }

    // Hoja Detalle
    const wsDetalle = wb.addWorksheet('Detalle')
    if (detailRows.length > 0) {
      wsDetalle.columns = Object.keys(detailRows[0]).map(key => ({ header: key, key, width: 25 }))
      detailRows.forEach(row => wsDetalle.addRow(row))
      wsDetalle.getRow(1).font = { bold: true }
    }

    // Descargar como archivo
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session?.name || 'sesion'}_resultados.xlsx`.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ_\- ]/g, '')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExporting(false)
  }

  async function generateAnalysis() {
    setGeneratingAnalysis(true)
    setAnalysisError('')

    // Primero obtener los datos consolidados
    const completedRespondents = respondents.filter(r => r.completed)
    if (completedRespondents.length === 0) {
      setAnalysisError('No hay encuestados completados para analizar.')
      setGeneratingAnalysis(false)
      return
    }

    const ids = completedRespondents.map(r => r.id)
    const { data: allResponses } = await supabase
      .from('responses')
      .select('value, questions(dimensions(name, display_order))')
      .in('respondent_id', ids)

    if (!allResponses || allResponses.length === 0) {
      setAnalysisError('No hay respuestas disponibles.')
      setGeneratingAnalysis(false)
      return
    }

    // Calcular promedios por dimensión
    const dimScores: Record<string, { name: string; total: number; count: number; order: number }> = {}
    allResponses.forEach((r: any) => {
      const dimName = r.questions.dimensions.name
      const dimOrder = r.questions.dimensions.display_order
      if (!dimScores[dimName]) dimScores[dimName] = { name: dimName, total: 0, count: 0, order: dimOrder }
      dimScores[dimName].total += r.value
      dimScores[dimName].count += 1
    })

    const dimensionScores = Object.values(dimScores)
      .sort((a, b) => a.order - b.order)
      .map(d => ({
        dimension: d.name,
        value: Math.round((d.total / d.count) * 10) / 10,
      }))

    // Llamar al API
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          sessionName: session?.name,
          dimensionScores,
          totalRespondents: completedRespondents.length,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setAnalysisError(err.error || 'Error al generar el análisis.')
        setGeneratingAnalysis(false)
        return
      }

      const data = await res.json()
      setAnalysisText(data.analysis)
    } catch {
      setAnalysisError('Error de conexión. Intenta de nuevo.')
    }

    setGeneratingAnalysis(false)
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
        <button
          onClick={deleteSession}
          disabled={deletingSession}
          className="ml-auto px-4 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {deletingSession ? 'Eliminando...' : 'Eliminar Sesión'}
        </button>
        <button
          onClick={exportToExcel}
          disabled={exporting || respondents.filter(r => r.completed).length === 0}
          className="px-4 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          {exporting ? 'Exportando...' : '📥 Exportar Excel'}
        </button>
      </div>

      {/* Dashboard de la sesión */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500 mb-1">Respuestas Recolectadas</p>
          <p className="text-3xl font-bold text-green-600">{sessionStats.totalCompleted}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500 mb-1">Tiempo Promedio de Respuesta</p>
          <p className="text-3xl font-bold text-purple-600">
            {sessionStats.avgTimeMinutes > 0 ? `${sessionStats.avgTimeMinutes} min` : '—'}
          </p>
        </div>
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

      {/* Sección de Análisis IA */}
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">🤖 Análisis IA</h2>
            <button
              onClick={generateAnalysis}
              disabled={generatingAnalysis || respondents.filter(r => r.completed).length === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {generatingAnalysis ? 'Generando análisis...' : analysisText ? '🔄 Regenerar Análisis' : '✨ Generar Análisis'}
            </button>
          </div>

          {analysisError && (
            <p className="text-red-600 text-sm mb-4">{analysisError}</p>
          )}

          {generatingAnalysis && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <p className="text-gray-500">Analizando resultados con IA...</p>
            </div>
          )}

          {!generatingAnalysis && analysisText && (
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {analysisText}
            </div>
          )}

          {!generatingAnalysis && !analysisText && !analysisError && (
            <p className="text-gray-400 text-sm text-center py-4">
              Genera un análisis interpretativo de los resultados consolidados usando inteligencia artificial.
              {respondents.filter(r => r.completed).length === 0 && (
                <span className="block mt-1 text-yellow-600">Se requiere al menos un encuestado completado.</span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
