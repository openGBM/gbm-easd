'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Instrument, InstrumentVersion, DimensionWithQuestions } from '@/types/database'
import * as ExcelJS from 'exceljs'
import Link from 'next/link'

export default function InstrumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const instrumentId = params.id as string
  const supabase = createClient()

  const [instrument, setInstrument] = useState<Instrument | null>(null)
  const [versions, setVersions] = useState<InstrumentVersion[]>([])
  const [currentVersion, setCurrentVersion] = useState<InstrumentVersion | null>(null)
  const [dimensions, setDimensions] = useState<DimensionWithQuestions[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [hasResponses, setHasResponses] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState(false)
  const [promptValue, setPromptValue] = useState('')

  useEffect(() => {
    checkAuthAndLoad()
  }, [instrumentId])

  async function checkAuthAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }
    await loadInstrument()
  }

  async function loadInstrument() {
    // Cargar instrumento
    const { data: instData } = await supabase
      .from('instruments')
      .select('*')
      .eq('id', instrumentId)
      .single()

    if (instData) setInstrument(instData)

    // Cargar versiones
    const { data: versionsData } = await supabase
      .from('instrument_versions')
      .select('*')
      .eq('instrument_id', instrumentId)
      .order('version_number', { ascending: false })

    if (versionsData) {
      setVersions(versionsData)
      const current = versionsData.find(v => v.is_current)
      if (current) {
        setCurrentVersion(current)
        await loadDimensions(current.id)
        await checkHasResponses(current.id)
      }
    }

    setLoading(false)
  }

  async function loadDimensions(versionId: string) {
    const { data } = await supabase
      .from('dimensions')
      .select('*, questions(*)')
      .eq('instrument_version_id', versionId)
      .order('display_order', { ascending: true })

    if (data) {
      const sorted = data.map(dim => ({
        ...dim,
        questions: (dim.questions || []).sort(
          (a: any, b: any) => a.display_order - b.display_order
        ),
      }))
      setDimensions(sorted)
    }
  }

  async function checkHasResponses(versionId: string) {
    // Verificar si hay sesiones con respondents completados en esta versión
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id')
      .eq('instrument_version_id', versionId)

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id)
      const { count } = await supabase
        .from('respondents')
        .select('*', { count: 'exact', head: true })
        .in('session_id', sessionIds)
        .eq('completed', true)

      setHasResponses((count || 0) > 0)
    } else {
      setHasResponses(false)
    }
  }

  // ===================== EXPORTAR A EXCEL =====================
  async function exportToExcel() {
    if (!currentVersion || dimensions.length === 0) return

    const wb = new ExcelJS.Workbook()

    // Hoja 1: Banco de Preguntas
    const ws = wb.addWorksheet('Banco de Preguntas')
    ws.columns = [
      { header: 'Dimensión', key: 'dimension', width: 30 },
      { header: 'Descripción Dimensión', key: 'dimDescription', width: 40 },
      { header: 'Color', key: 'color', width: 10 },
      { header: 'Orden Dimensión', key: 'dimOrder', width: 15 },
      { header: 'Pregunta', key: 'question', width: 80 },
      { header: 'Orden Pregunta', key: 'qOrder', width: 15 },
    ]
    ws.getRow(1).font = { bold: true }

    dimensions.forEach(dim => {
      dim.questions.forEach(q => {
        ws.addRow({
          dimension: dim.name,
          dimDescription: dim.description || '',
          color: dim.color || '',
          dimOrder: dim.display_order,
          question: q.text,
          qOrder: q.display_order,
        })
      })
    })

    // Hoja 2: Escala
    const wsScale = wb.addWorksheet('Escala')
    wsScale.columns = [
      { header: 'Valor', key: 'value', width: 10 },
      { header: 'Etiqueta', key: 'label', width: 30 },
      { header: 'Descripción', key: 'description', width: 60 },
    ]
    wsScale.getRow(1).font = { bold: true }

    // Usar scale_labels del instrumento o las default
    const defaultScale = [
      { value: 5, label: 'Totalmente de acuerdo', description: '' },
      { value: 4, label: 'De acuerdo', description: '' },
      { value: 3, label: 'Depende / Neutral', description: '' },
      { value: 2, label: 'En desacuerdo', description: '' },
      { value: 1, label: 'Totalmente en desacuerdo', description: '' },
    ]
    const scaleData = (currentVersion.scale_labels as any[]) || defaultScale
    scaleData
      .sort((a: any, b: any) => a.value - b.value)
      .forEach((s: any) => {
        wsScale.addRow({ value: s.value, label: s.label, description: s.description || '' })
      })

    // Descargar
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${instrument?.name || 'instrumento'}_v${currentVersion.version_tag}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ===================== IMPORTAR DESDE EXCEL =====================
  async function importFromExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !currentVersion) return

    setImporting(true)

    try {
      const buffer = await file.arrayBuffer()
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(buffer)

      const ws = wb.getWorksheet('Banco de Preguntas')
        || wb.worksheets.find(s => s.name.toLowerCase().includes('banco'))
        || wb.getWorksheet(1)
      if (!ws) {
        alert('No se encontró una hoja con el banco de preguntas en el archivo.')
        setImporting(false)
        return
      }

      // Parsear filas (saltar encabezado)
      const parsedDimensions: Record<string, {
        name: string
        description: string
        color: string
        order: number
        questions: { text: string; order: number }[]
      }> = {}

      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // Saltar encabezado

        const dimName = row.getCell(1).value?.toString().trim() || ''
        const dimDesc = row.getCell(2).value?.toString().trim() || ''
        const color = row.getCell(3).value?.toString().trim() || ''
        const dimOrder = Number(row.getCell(4).value) || 0
        const questionText = row.getCell(5).value?.toString().trim() || ''
        const qOrder = Number(row.getCell(6).value) || 0

        if (!dimName || !questionText) return

        if (!parsedDimensions[dimName]) {
          parsedDimensions[dimName] = {
            name: dimName,
            description: dimDesc,
            color,
            order: dimOrder,
            questions: [],
          }
        }
        parsedDimensions[dimName].questions.push({ text: questionText, order: qOrder })
      })

      const dimsArray = Object.values(parsedDimensions)
      if (dimsArray.length === 0) {
        alert('No se encontraron datos válidos en el archivo.')
        setImporting(false)
        return
      }

      // ===================== VALIDACIÓN DEL EXCEL =====================
      const errors: string[] = []

      // Validar encabezados mínimos (ya se parseó, pero verificar estructura)
      if (dimsArray.some(d => !d.name.trim())) {
        errors.push('Hay dimensiones sin nombre.')
      }

      // Validar que cada dimensión tenga al menos una pregunta
      dimsArray.forEach(d => {
        if (d.questions.length === 0) {
          errors.push(`La dimensión "${d.name}" no tiene preguntas.`)
        }
      })

      // Validar que las preguntas no estén vacías
      dimsArray.forEach(d => {
        d.questions.forEach((q, idx) => {
          if (!q.text.trim()) {
            errors.push(`Dimensión "${d.name}": la pregunta ${idx + 1} está vacía.`)
          }
        })
      })

      // Validar órdenes duplicados en dimensiones
      const dimOrders = dimsArray.map(d => d.order).filter(o => o > 0)
      const duplicateDimOrders = dimOrders.filter((o, i) => dimOrders.indexOf(o) !== i)
      if (duplicateDimOrders.length > 0) {
        errors.push(`Órdenes de dimensión duplicados: ${[...new Set(duplicateDimOrders)].join(', ')}`)
      }

      // Validar órdenes duplicados en preguntas dentro de cada dimensión
      dimsArray.forEach(d => {
        const qOrders = d.questions.map(q => q.order).filter(o => o > 0)
        const duplicateQOrders = qOrders.filter((o, i) => qOrders.indexOf(o) !== i)
        if (duplicateQOrders.length > 0) {
          errors.push(`Dimensión "${d.name}": órdenes de pregunta duplicados: ${[...new Set(duplicateQOrders)].join(', ')}`)
        }
      })

      // Validar formato de color (si se proporcionó)
      const colorRegex = /^#[0-9a-fA-F]{6}$/
      dimsArray.forEach(d => {
        if (d.color && !colorRegex.test(d.color)) {
          errors.push(`Dimensión "${d.name}": color "${d.color}" no es un hex válido (formato: #RRGGBB).`)
        }
      })

      // Si hay errores, mostrar y abortar
      if (errors.length > 0) {
        alert(`Errores de validación:\n\n${errors.join('\n')}`)
        setImporting(false)
        return
      }

      // Auto-asignar órdenes si faltan (orden 0 = no definido)
      dimsArray.forEach((d, idx) => {
        if (d.order === 0) d.order = idx + 1
        d.questions.forEach((q, qIdx) => {
          if (q.order === 0) q.order = qIdx + 1
        })
      })

      // Parsear hoja de Escala (opcional — busca por nombre flexible)
      let scaleLabels: { value: number; label: string; description?: string }[] | null = null
      const wsScale = wb.getWorksheet('Escala')
        || wb.worksheets.find(ws => ws.name.toLowerCase().includes('escala'))
      if (wsScale) {
        scaleLabels = []
        wsScale.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return
          const value = Number(row.getCell(1).value) || 0
          const label = row.getCell(2).value?.toString().trim() || ''
          const description = row.getCell(3).value?.toString().trim() || ''
          if (value > 0 && label) {
            scaleLabels!.push({ value, label, ...(description ? { description } : {}) })
          }
        })
        if (scaleLabels.length === 0) scaleLabels = null
      }

      // Determinar si crear nueva versión o editar la actual
      let targetVersionId = currentVersion.id

      if (hasResponses) {
        // Crear nueva versión
        const newVersionNumber = Math.max(...versions.map(v => v.version_number)) + 1
        const newTag = String(newVersionNumber)

        // Desmarcar la versión actual
        await supabase
          .from('instrument_versions')
          .update({ is_current: false })
          .eq('id', currentVersion.id)

        // Crear nueva versión
        const { data: newVersion } = await supabase
          .from('instrument_versions')
          .insert({
            instrument_id: instrumentId,
            version_number: newVersionNumber,
            version_tag: newTag,
            is_current: true,
            notes: `Importado desde Excel (${file.name})`,
            scale_labels: scaleLabels,
          })
          .select('id')
          .single()

        if (!newVersion) {
          alert('Error al crear nueva versión.')
          setImporting(false)
          return
        }
        targetVersionId = newVersion.id
      } else {
        // Editar la versión actual: eliminar dimensiones y preguntas existentes
        const dimIds = dimensions.map(d => d.id)
        if (dimIds.length > 0) {
          await supabase.from('questions').delete().in('dimension_id', dimIds)
          await supabase.from('dimensions').delete().in('id', dimIds)
        }
        // Actualizar scale_labels en la versión actual
        if (scaleLabels !== undefined) {
          await supabase
            .from('instrument_versions')
            .update({ scale_labels: scaleLabels })
            .eq('id', currentVersion.id)
        }
      }

      // Insertar dimensiones y preguntas
      let insertedDims = 0
      let insertedQuestions = 0

      for (const dim of dimsArray) {
        const { data: newDim, error: dimError } = await supabase
          .from('dimensions')
          .insert({
            name: dim.name,
            description: dim.description || null,
            color: dim.color || null,
            display_order: dim.order,
            instrument_version_id: targetVersionId,
          })
          .select('id')
          .single()

        if (dimError) {
          console.error('Error insertando dimensión:', dim.name, dimError)
          continue
        }

        if (newDim) {
          insertedDims++
          const questionsToInsert = dim.questions.map(q => ({
            dimension_id: newDim.id,
            text: q.text,
            display_order: q.order,
          }))
          const { error: qError } = await supabase.from('questions').insert(questionsToInsert)
          if (qError) {
            console.error('Error insertando preguntas:', qError)
          } else {
            insertedQuestions += dim.questions.length
          }
        }
      }

      if (insertedDims === 0) {
        alert('Error: No se pudieron insertar las dimensiones. Verifica permisos de la base de datos.')
      } else {
        alert(`Importación exitosa: ${insertedDims} dimensiones, ${insertedQuestions} preguntas.`)
      }
      await loadInstrument()
    } catch (err) {
      console.error('Error importando:', err)
      alert('Error al procesar el archivo Excel.')
    }

    setImporting(false)
    // Reset file input
    e.target.value = ''
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  if (!instrument) {
    return <p className="text-red-600">Instrumento no encontrado</p>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/instrumentos" className="text-blue-600 hover:text-blue-700">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{instrument.name}</h1>
        {currentVersion && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            v{currentVersion.version_tag}
          </span>
        )}
      </div>

      {instrument.description && (
        <p className="text-gray-600 mb-4">{instrument.description}</p>
      )}

      {instrument.ai_expertise_prompt && !editingPrompt && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-indigo-600">🤖 Expertise IA</p>
            <button
              onClick={() => { setEditingPrompt(true); setPromptValue(instrument.ai_expertise_prompt || '') }}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Editar
            </button>
          </div>
          <p className="text-sm text-indigo-900">{instrument.ai_expertise_prompt}</p>
        </div>
      )}

      {!instrument.ai_expertise_prompt && !editingPrompt && (
        <div className="mb-6">
          <button
            onClick={() => setEditingPrompt(true)}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            + Agregar expertise IA para análisis
          </button>
        </div>
      )}

      {editingPrompt && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
          <p className="text-xs font-medium text-indigo-600 mb-2">🤖 Expertise IA</p>
          <textarea
            value={promptValue}
            onChange={e => setPromptValue(e.target.value)}
            rows={3}
            placeholder="Ej: Eres un consultor experto en transformación digital y adopción de IA..."
            className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                await supabase
                  .from('instruments')
                  .update({ ai_expertise_prompt: promptValue.trim() || null })
                  .eq('id', instrumentId)
                setEditingPrompt(false)
                await loadInstrument()
              }}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Guardar
            </button>
            <button
              onClick={() => setEditingPrompt(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Acciones: Exportar / Importar */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Banco de Preguntas</h2>

        {hasResponses && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ⚠️ Esta versión ya tiene respuestas. Al importar un Excel se creará una <strong>nueva versión</strong> automáticamente.
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <button
            onClick={exportToExcel}
            disabled={dimensions.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            📥 Exportar Excel
          </button>
          <label className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer">
            {importing ? 'Importando...' : '📤 Importar Excel'}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={importFromExcel}
              disabled={importing}
              className="hidden"
            />
          </label>
        </div>

        {/* Vista previa del banco */}
        {dimensions.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin dimensiones. Importa un Excel para configurar el banco.</p>
        ) : (
          <div className="space-y-4">
            {dimensions.map(dim => (
              <div key={dim.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {dim.color && (
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dim.color }}></span>
                  )}
                  <h3 className="font-bold text-gray-900">{dim.display_order}. {dim.name}</h3>
                  <span className="text-xs text-gray-400">{dim.questions.length} preguntas</span>
                </div>
                {dim.description && (
                  <p className="text-sm text-gray-500 mb-2">{dim.description}</p>
                )}
                <ul className="space-y-1 pl-4">
                  {dim.questions.map(q => (
                    <li key={q.id} className="text-sm text-gray-700">
                      <span className="text-gray-400 mr-1">{q.display_order}.</span>
                      {q.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de versiones */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-medium mb-4">Historial de Versiones</h2>
        {versions.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin versiones.</p>
        ) : (
          <div className="space-y-2">
            {versions.map(v => (
              <div
                key={v.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  v.is_current ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div>
                  <span className="font-medium text-sm">v{v.version_tag}</span>
                  {v.is_current && (
                    <span className="ml-2 text-xs text-indigo-600 font-medium">· Actual</span>
                  )}
                  {v.notes && (
                    <p className="text-xs text-gray-500 mt-0.5">{v.notes}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(v.created_at).toLocaleDateString('es-MX')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
