'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getClientContainer } from '@/core/client-container'
import { TOKENS } from '@/core/types/tokens'
import { isOk } from '@/core/errors/result'
import { Session, Respondent } from '@/types/database'
import RadarChart from '@/components/RadarChart'
import ResultsTable from '@/components/ResultsTable'
import InstrumentBadge from '@/components/InstrumentBadge'
import ExportPdfButton from '@/components/ExportPdfButton'
import ConfirmModal from '@/components/ConfirmModal'
import { showToast } from '@/components/Toast'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  // Auth-only: keep createClient for supabase.auth.getUser() (migrates in Auth unit)
  const supabase = createClient()
  const container = getClientContainer()
  const sessionRepo = container.resolve(TOKENS.SessionRepository)
  const respondentRepo = container.resolve(TOKENS.RespondentRepository)
  const responseRepo = container.resolve(TOKENS.ResponseRepository)
  const analysisRepo = container.resolve(TOKENS.AnalysisRepository)

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
  const [instrumentInfo, setInstrumentInfo] = useState<{ name: string; versionTag: string } | null>(null)
  const [maturityLevels, setMaturityLevels] = useState<any[] | null>(null)
  const [showDeleteSessionModal, setShowDeleteSessionModal] = useState(false)
  const [showDeleteRespondentModal, setShowDeleteRespondentModal] = useState<string | null>(null)

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
    // Cargar sesión con info de instrumento
    const sessionResult = await sessionRepo.findByIdWithInstrument(sessionId)
    if (isOk(sessionResult)) {
      const s = sessionResult.value
      setSession({
        id: s.id,
        name: s.name,
        is_active: s.isActive,
        created_at: s.createdAt,
        instrument_version_id: s.instrumentVersionId,
      } as any)

      if (s.instrumentName && s.versionTag) {
        setInstrumentInfo({ name: s.instrumentName, versionTag: s.versionTag })
      }
      if (s.maturityLevels) {
        setMaturityLevels(s.maturityLevels as any[])
      }
    }

    // Cargar encuestados
    const respondentsResult = await respondentRepo.findBySessionId(sessionId)
    if (isOk(respondentsResult)) {
      const respondentData = respondentsResult.value.map(r => ({
        ...r,
        id: r.id,
        name: r.name,
        email: r.email,
        completed: r.completed,
        created_at: r.createdAt,
        session_id: r.sessionId,
        completed_at: r.completedAt || null,
      }))
      setRespondents(respondentData as any)

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
    const analysisResult = await analysisRepo.findLatest(sessionId)
    if (isOk(analysisResult) && analysisResult.value) {
      setAnalysisText(analysisResult.value.content)
    }

    setLoading(false)
  }

  async function viewResponses(respondentId: string) {
    setSelectedRespondent(respondentId)

    const scoresResult = await responseRepo.getAggregatedByRespondent(respondentId)
    if (isOk(scoresResult) && scoresResult.value.length > 0) {
      const formatted = scoresResult.value.map(d => ({
        dimension: d.dimensionName,
        value: Math.round(d.averageValue * 10) / 10,
      }))
      setChartData(formatted)
    } else {
      setChartData([])
    }
  }

  async function deleteRespondent(respondentId: string) {
    setShowDeleteRespondentModal(respondentId)
  }

  async function confirmDeleteRespondent() {
    const respondentId = showDeleteRespondentModal
    if (!respondentId) return
    setShowDeleteRespondentModal(null)

    // Eliminar respuestas y encuestado via repo
    await responseRepo.deleteByRespondentId(respondentId)
    await respondentRepo.delete(respondentId)

    if (selectedRespondent === respondentId) {
      setSelectedRespondent(null)
      setChartData([])
    }
    await loadSession()
  }

  async function deleteSession() {
    if (!session) return
    setShowDeleteSessionModal(true)
  }

  async function confirmDeleteSession() {
    setShowDeleteSessionModal(false)
    setDeletingSession(true)

    // Eliminar encuestados y respuestas de la sesión
    await respondentRepo.deleteBySessionId(sessionId)
    // Eliminar la sesión
    await sessionRepo.delete(sessionId)

    router.push('/admin')
  }

  async function exportToExcel() {
    setExporting(true)

    // Obtener encuestados completados
    const completedRespondents = respondents.filter(r => r.completed)
    if (completedRespondents.length === 0) {
      showToast('warning', 'No hay encuestados completados para exportar')
      setExporting(false)
      return
    }

    const ids = completedRespondents.map(r => r.id)

    // Obtener todas las respuestas con dimensiones y preguntas via repo
    const responsesResult = await responseRepo.findByRespondentIds(ids)
    if (!isOk(responsesResult) || responsesResult.value.length === 0) {
      showToast('warning', 'No hay respuestas para exportar')
      setExporting(false)
      return
    }

    const allResponses = responsesResult.value

    // Obtener dimensiones únicas ordenadas
    const dimensionMap = new Map<string, { name: string; order: number }>()
    allResponses.forEach(r => {
      if (r.dimension && !dimensionMap.has(r.dimension.name)) {
        dimensionMap.set(r.dimension.name, { name: r.dimension.name, order: r.dimension.displayOrder })
      }
    })
    const dimensions = Array.from(dimensionMap.values()).sort((a, b) => a.order - b.order)

    // Construir filas: una fila por encuestado con sus respuestas agrupadas por dimensión
    const rows: Record<string, any>[] = []

    for (const respondent of completedRespondents) {
      const respondentResponses = allResponses.filter((r: any) => r.respondentId === respondent.id)
      const row: Record<string, any> = {
        'Nombre': respondent.name,
        'Correo': respondent.email,
        'Fecha': new Date(respondent.created_at).toLocaleDateString('es-MX'),
      }

      // Calcular promedio por dimensión
      const dimScores: Record<string, { total: number; count: number }> = {}
      respondentResponses.forEach((r: any) => {
        const dimName = r.dimension?.name
        if (!dimName) return
        if (!dimScores[dimName]) dimScores[dimName] = { total: 0, count: 0 }
        dimScores[dimName].total += r.value
        dimScores[dimName].count += 1
      })

      // Agregar promedio por dimensión como columna
      dimensions.forEach(dim => {
        const score = dimScores[dim.name]
        row[dim.name] = score ? Math.round((score.total / score.count) * 10) / 10 : 0
      })

      // Total general
      const totalValues = respondentResponses.map((r: any) => r.value).filter((v: any) => v != null)
      row['Promedio General'] = totalValues.length > 0
        ? Math.round((totalValues.reduce((a: number, b: number) => a + b, 0) / totalValues.length) * 10) / 10
        : 0

      rows.push(row)
    }

    // Crear hoja de detalle (todas las respuestas individuales)
    const detailRows: Record<string, any>[] = []
    for (const respondent of completedRespondents) {
      const respondentResponses = allResponses
        .filter((r: any) => r.respondentId === respondent.id)
        .sort((a: any, b: any) => {
          const dimDiff = (a.dimension?.displayOrder || 0) - (b.dimension?.displayOrder || 0)
          if (dimDiff !== 0) return dimDiff
          return (a.question?.displayOrder || 0) - (b.question?.displayOrder || 0)
        })

      respondentResponses.forEach((r: any) => {
        detailRows.push({
          'Nombre': respondent.name,
          'Correo': respondent.email,
          'Dimensión': r.dimension?.name || '',
          'Pregunta': r.question?.text || '',
          'Valor': r.value,
        })
      })
    }

    // Generar archivo Excel con 2 hojas usando ExcelJS (dynamic import para reducir bundle)
    const ExcelJS = await import('exceljs')
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

    // Obtener scores agregados por sesión usando el repo
    const scoresResult = await responseRepo.getAggregatedBySession(sessionId)
    if (!isOk(scoresResult) || scoresResult.value.length === 0) {
      setAnalysisError('No hay respuestas disponibles.')
      setGeneratingAnalysis(false)
      return
    }

    const dimensionScores = scoresResult.value.map(d => ({
      dimension: d.dimensionName,
      value: Math.round(d.averageValue * 10) / 10,
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
      if (data.saveWarning) {
        setAnalysisError(data.saveWarning)
      }
    } catch {
      setAnalysisError('Error de conexión. Intenta de nuevo.')
    }

    setGeneratingAnalysis(false)
  }

  async function loadConsolidated() {
    setViewMode('consolidated')
    setSelectedRespondent(null)

    // Obtener scores consolidados de la sesión usando el repo
    const scoresResult = await responseRepo.getAggregatedBySession(sessionId)
    if (isOk(scoresResult) && scoresResult.value.length > 0) {
      const formatted = scoresResult.value.map(d => ({
        dimension: d.dimensionName,
        value: Math.round(d.averageValue * 10) / 10,
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
        {instrumentInfo && (
          <InstrumentBadge
            instrumentName={instrumentInfo.name}
            versionTag={instrumentInfo.versionTag}
          />
        )}
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
            {sessionStats.avgTimeMinutes > 0 ? `${sessionStats.avgTimeMinutes} min` : 'Sin datos'}
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
              <div id="admin-results-content">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-bold text-center flex-1">
                      {viewMode === 'consolidated'
                        ? 'Resultados Consolidados'
                        : `Resultados — ${respondents.find(r => r.id === selectedRespondent)?.name || ''}`
                      }
                    </h2>
                    <ExportPdfButton
                      targetId="admin-results-content"
                      fileName={`resultados-${viewMode === 'consolidated' ? 'consolidado' : respondents.find(r => r.id === selectedRespondent)?.name?.replace(/\s+/g, '-').toLowerCase() || 'encuestado'}-${session.name.replace(/\s+/g, '-').toLowerCase()}`}
                      pdfTitle={viewMode === 'consolidated' ? 'Resultados Consolidados' : `Resultados — ${respondents.find(r => r.id === selectedRespondent)?.name || ''}`}
                      pdfSubtitle={`${session.name}${instrumentInfo ? ` · ${instrumentInfo.name} v${instrumentInfo.versionTag}` : ''}`}
                    />
                  </div>
                  {viewMode === 'consolidated' && (
                    <p className="text-sm text-gray-500 text-center mb-4">
                      Promedio de {respondents.filter(r => r.completed).length} encuestado(s) completado(s)
                    </p>
                  )}
                  <RadarChart data={chartData} />
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
                  <h2 className="text-lg font-bold mb-4 text-center">Resumen</h2>
                  <ResultsTable data={chartData} mode="average" maturityLevels={maturityLevels} />
                </div>
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
            <div className="flex gap-2">
              {analysisText && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(analysisText!)
                    showToast('success', 'Análisis copiado al portapapeles')
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  📋 Copiar
                </button>
              )}
              <button
                onClick={generateAnalysis}
                disabled={generatingAnalysis || respondents.filter(r => r.completed).length === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {generatingAnalysis ? 'Generando análisis...' : analysisText ? '🔄 Regenerar Análisis' : '✨ Generar Análisis'}
              </button>
            </div>
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
            <div className="max-w-none text-gray-700 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_li]:mb-1 [&_strong]:font-bold">
              <ReactMarkdown>{analysisText}</ReactMarkdown>
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

      {/* Modales de confirmación */}
      <ConfirmModal
        isOpen={showDeleteSessionModal}
        title="Eliminar Sesión"
        message={`¿Eliminar la sesión "${session?.name}" y todos sus encuestados y respuestas?`}
        warning="Esta acción no se puede deshacer. Antes de eliminar una sesión asegúrese de haber exportado los datos a Excel y generado el análisis IA si lo requiere."
        confirmLabel="Sí, eliminar"
        onConfirm={confirmDeleteSession}
        onCancel={() => setShowDeleteSessionModal(false)}
      />
      <ConfirmModal
        isOpen={!!showDeleteRespondentModal}
        title="Eliminar Encuestado"
        message="¿Eliminar este encuestado y todas sus respuestas?"
        warning="Esta acción no se puede deshacer. Las respuestas de este encuestado se perderán permanentemente."
        confirmLabel="Sí, eliminar"
        onConfirm={confirmDeleteRespondent}
        onCancel={() => setShowDeleteRespondentModal(null)}
      />
    </div>
  )
}
