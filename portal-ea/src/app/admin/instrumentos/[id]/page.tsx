'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getClientContainer } from '@/core/client-container'
import { TOKENS } from '@/core/types/tokens'
import { isOk } from '@/core/errors/result'
import { Instrument, InstrumentVersion, DimensionWithQuestions } from '@/types/database'
import { showToast } from '@/components/Toast'
import PromptModal from '@/components/PromptModal'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

export default function InstrumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const instrumentId = params.id as string
  // Auth-only + complex version management: keep supabase direct for most operations
  // TODO: Migrate remaining Supabase operations to abstraction layer when repos support
  // update(), version management, dimension/question inline editing, import/export
  const supabase = createClient()
  const container = getClientContainer()
  const instrumentRepo = container.resolve(TOKENS.InstrumentRepository)
  const dimensionRepo = container.resolve(TOKENS.DimensionRepository)

  const [instrument, setInstrument] = useState<Instrument | null>(null)
  const [versions, setVersions] = useState<InstrumentVersion[]>([])
  const [currentVersion, setCurrentVersion] = useState<InstrumentVersion | null>(null)
  const [dimensions, setDimensions] = useState<DimensionWithQuestions[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [hasResponses, setHasResponses] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState(false)
  const [promptValue, setPromptValue] = useState('')
  const [promptExpanded, setPromptExpanded] = useState(false)
  const [maturityLevelsEdit, setMaturityLevelsEdit] = useState<{ label: string; color: string; minAverage: number; maxAverage: number }[]>([])
  const [promptModal, setPromptModal] = useState<{ type: 'dimension' | 'question'; dimId?: string; order?: number } | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndLoad()
  }, [instrumentId])

  async function checkAuthAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }
    setUserId(user.id)

    // Obtener rol del usuario para control de visibilidad
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile) setUserRole(profile.role)

    await loadInstrument()
  }

  async function loadInstrument() {
    // Cargar instrumento usando repo para el dato inicial
    const instResult = await instrumentRepo.findById(instrumentId)
    if (isOk(instResult)) {
      // El repo retorna InstrumentWithVersion, necesitamos el objeto completo
      // Para campos extra (ai_expertise_prompt, visibility, owner_id) que no están en el DTO,
      // cargamos directo de Supabase
      // TODO: Extender InstrumentRepository.findById() para incluir estos campos
      const { data: instData } = await supabase
        .from('instruments')
        .select('*')
        .eq('id', instrumentId)
        .single()
      if (instData) setInstrument(instData)
    }

    // Cargar versiones (mantener Supabase directo — el repo no expone listado completo de versiones)
    // TODO: Agregar InstrumentRepository.findVersionsByInstrumentId()
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
        // Inicializar editor de niveles de madurez
        const defaultLevels = [
          { label: 'Naciente', color: '#EF4444', minAverage: 1.0, maxAverage: 2.3 },
          { label: 'Base', color: '#F59E0B', minAverage: 2.4, maxAverage: 3.6 },
          { label: 'Clase Mundial', color: '#10B981', minAverage: 3.7, maxAverage: 5.0 },
        ]
        setMaturityLevelsEdit((current.maturity_levels as any[]) || defaultLevels)
        await loadDimensions(current.id)
        await checkHasResponses(current.id)
      }
    }

    setLoading(false)
  }

  async function loadDimensions(versionId: string) {
    const result = await dimensionRepo.findByInstrumentVersionId(versionId)
    if (isOk(result)) {
      const sorted = result.value.map(dim => ({
        ...dim,
        id: dim.id,
        name: dim.name,
        description: dim.description,
        color: dim.color,
        display_order: dim.displayOrder,
        instrument_version_id: versionId,
        questions: dim.questions.map(q => ({
          ...q,
          id: q.id,
          text: q.text,
          display_order: q.displayOrder,
          dimension_id: q.dimensionId,
        })).sort((a: any, b: any) => a.display_order - b.display_order),
      }))
      setDimensions(sorted as any)
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

  // ===================== EDITOR VISUAL =====================

  /**
   * Si la versión actual tiene respuestas, crea una nueva versión duplicando
   * dimensiones y preguntas, y retorna el ID de la versión editable.
   * Si no tiene respuestas, retorna el ID de la versión actual.
   */
  async function ensureEditableVersion(): Promise<string | null> {
    if (!currentVersion) return null

    if (!hasResponses) return currentVersion.id

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
        notes: 'Creada por edición visual del banco de preguntas',
        scale_labels: currentVersion.scale_labels,
        maturity_levels: currentVersion.maturity_levels,
      })
      .select('id')
      .single()

    if (!newVersion) {
      showToast('error', 'Error al crear nueva versión')
      return null
    }

    // Duplicar dimensiones y preguntas de la versión anterior
    const { data: origDims } = await supabase
      .from('dimensions')
      .select('*, questions(*)')
      .eq('instrument_version_id', currentVersion.id)
      .order('display_order')

    if (origDims) {
      for (const dim of origDims) {
        const { data: newDim } = await supabase
          .from('dimensions')
          .insert({
            name: dim.name,
            description: dim.description,
            color: dim.color,
            display_order: dim.display_order,
            instrument_version_id: newVersion.id,
          })
          .select('id')
          .single()

        if (newDim && dim.questions) {
          const questions = (dim.questions as any[]).map(q => ({
            dimension_id: newDim.id,
            text: q.text,
            display_order: q.display_order,
          }))
          if (questions.length > 0) {
            await supabase.from('questions').insert(questions)
          }
        }
      }
    }

    showToast('success', `Nueva versión v${newTag} creada`)
    await loadInstrument()
    return newVersion.id
  }

  async function addDimension() {
    if (!currentVersion) return
    setPromptModal({ type: 'dimension' })
  }

  async function confirmAddDimension(name: string) {
    if (!currentVersion) return
    setPromptModal(null)

    const targetVersionId = await ensureEditableVersion()
    if (!targetVersionId) return

    const newOrder = dimensions.length > 0 ? Math.max(...dimensions.map(d => d.display_order)) + 1 : 1

    const { error } = await supabase
      .from('dimensions')
      .insert({
        name,
        display_order: newOrder,
        instrument_version_id: targetVersionId,
      })

    if (error) {
      showToast('error', 'Error al agregar dimensión')
      return
    }
    await loadDimensions(targetVersionId)
  }

  async function deleteDimension(dimId: string) {
    if (!confirm('⚠️ ¿Eliminar esta dimensión y todas sus preguntas?\n\nEsta acción no se puede deshacer. Todas las preguntas asociadas se perderán permanentemente.')) return

    const targetVersionId = await ensureEditableVersion()
    if (!targetVersionId) return

    // Si se creó una nueva versión, necesitamos encontrar la dimensión equivalente en la nueva versión
    // (la dimensión original ya fue duplicada en la nueva versión por ensureEditableVersion)
    if (targetVersionId !== currentVersion?.id) {
      // Buscar la dimensión duplicada por nombre y orden en la nueva versión
      const dim = dimensions.find(d => d.id === dimId)
      if (!dim) return

      const { data: newDim } = await supabase
        .from('dimensions')
        .select('id')
        .eq('instrument_version_id', targetVersionId)
        .eq('display_order', dim.display_order)
        .single()

      if (newDim) {
        await supabase.from('questions').delete().eq('dimension_id', newDim.id)
        await supabase.from('dimensions').delete().eq('id', newDim.id)
      }
    } else {
      await supabase.from('questions').delete().eq('dimension_id', dimId)
      await supabase.from('dimensions').delete().eq('id', dimId)
    }

    await loadDimensions(targetVersionId)
  }

  async function addQuestion(dimId: string, order: number) {
    setPromptModal({ type: 'question', dimId, order })
  }

  async function confirmAddQuestion(text: string) {
    if (!promptModal || promptModal.type !== 'question') return
    const { dimId, order } = promptModal
    setPromptModal(null)

    const { error } = await supabase
      .from('questions')
      .insert({ dimension_id: dimId, text, display_order: order || 1 })

    if (error) {
      showToast('error', 'Error al agregar pregunta')
      return
    }
    if (currentVersion) await loadDimensions(currentVersion.id)
  }

  async function deleteQuestion(questionId: string, dimId: string) {
    await supabase.from('questions').delete().eq('id', questionId)
    if (currentVersion) await loadDimensions(currentVersion.id)
  }

  async function updateDimensionName(dimId: string, newName: string) {
    if (!newName.trim()) return
    await supabase.from('dimensions').update({ name: newName.trim() }).eq('id', dimId)
  }

  async function updateDimensionDescription(dimId: string, newDescription: string) {
    await supabase.from('dimensions').update({ description: newDescription.trim() || null }).eq('id', dimId)
  }

  async function updateDimensionColor(dimId: string, newColor: string) {
    await supabase.from('dimensions').update({ color: newColor }).eq('id', dimId)
  }

  async function updateQuestionText(questionId: string, newText: string) {
    if (!newText.trim()) return
    await supabase.from('questions').update({ text: newText.trim() }).eq('id', questionId)
  }

  async function updateQuestionField(questionId: string, field: string, value: any) {
    await supabase.from('questions').update({ [field]: value }).eq('id', questionId)
  }

  async function moveDimension(dimId: string, direction: 'up' | 'down') {
    const idx = dimensions.findIndex(d => d.id === dimId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= dimensions.length) return

    const current = dimensions[idx]
    const swap = dimensions[swapIdx]

    // Usar valor temporal para evitar conflicto
    const tempOrder = -999
    await supabase.from('dimensions').update({ display_order: tempOrder }).eq('id', current.id)
    await supabase.from('dimensions').update({ display_order: current.display_order }).eq('id', swap.id)
    await supabase.from('dimensions').update({ display_order: swap.display_order }).eq('id', current.id)

    if (currentVersion) await loadDimensions(currentVersion.id)
  }

  async function moveQuestion(questionId: string, dimId: string, direction: 'up' | 'down') {
    const dim = dimensions.find(d => d.id === dimId)
    if (!dim) return
    const idx = dim.questions.findIndex(q => q.id === questionId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= dim.questions.length) return

    const current = dim.questions[idx]
    const swap = dim.questions[swapIdx]

    // Usar valor temporal para evitar conflicto de constraint
    const tempOrder = -999
    await supabase.from('questions').update({ display_order: tempOrder }).eq('id', current.id)
    await supabase.from('questions').update({ display_order: current.display_order }).eq('id', swap.id)
    await supabase.from('questions').update({ display_order: swap.display_order }).eq('id', current.id)

    if (currentVersion) await loadDimensions(currentVersion.id)
  }

  async function saveScaleLabels() {
    if (!currentVersion) return
    const labels: { value: number; label: string; description?: string }[] = []
    for (let v = 1; v <= 5; v++) {
      const labelEl = document.getElementById(`scale-label-${v}`) as HTMLInputElement
      const descEl = document.getElementById(`scale-desc-${v}`) as HTMLInputElement
      const label = labelEl?.value.trim() || ''
      const description = descEl?.value.trim() || ''
      if (label) {
        labels.push({ value: v, label, ...(description ? { description } : {}) })
      }
    }

    const { error } = await supabase
      .from('instrument_versions')
      .update({ scale_labels: labels.length > 0 ? labels : null })
      .eq('id', currentVersion.id)

    if (error) {
      showToast('error', 'Error al guardar escala')
    } else {
      showToast('success', 'Escala guardada exitosamente')
      await loadInstrument()
    }
  }

  function updateMaturityLevel(idx: number, field: string, value: any) {
    setMaturityLevelsEdit(prev => prev.map((lvl, i) => i === idx ? { ...lvl, [field]: value } : lvl))
  }

  function addMaturityLevel() {
    const last = maturityLevelsEdit[maturityLevelsEdit.length - 1]
    const newMin = last ? last.maxAverage + 0.1 : 1.0
    setMaturityLevelsEdit(prev => [...prev, { label: '', color: '#666666', minAverage: Math.round(newMin * 10) / 10, maxAverage: 5.0 }])
  }

  function removeMaturityLevel(idx: number) {
    setMaturityLevelsEdit(prev => prev.filter((_, i) => i !== idx))
  }

  async function saveMaturityLevels() {
    if (!currentVersion) return

    // Validar
    const sorted = [...maturityLevelsEdit].sort((a, b) => a.minAverage - b.minAverage)
    const errors: string[] = []

    sorted.forEach((lvl, idx) => {
      if (!lvl.label.trim()) errors.push(`Nivel ${idx + 1}: falta nombre.`)
      if (lvl.minAverage >= lvl.maxAverage) errors.push(`"${lvl.label}": mín (${lvl.minAverage}) debe ser menor que máx (${lvl.maxAverage}).`)
      if (lvl.color && !/^#[0-9a-fA-F]{6}$/.test(lvl.color)) errors.push(`"${lvl.label}": color inválido.`)
      if (idx < sorted.length - 1 && lvl.maxAverage > sorted[idx + 1].minAverage) {
        errors.push(`"${lvl.label}" y "${sorted[idx + 1].label}" se solapan.`)
      }
    })

    if (sorted.length > 0) {
      if (sorted[0].minAverage > 1.0) errors.push(`El primer nivel no cubre desde 1.0.`)
      if (sorted[sorted.length - 1].maxAverage < 5.0) errors.push(`El último nivel no cubre hasta 5.0.`)

      // Validar huecos entre niveles
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i + 1].minAverage - sorted[i].maxAverage
        if (gap > 0.2) {
          errors.push(`Hueco entre "${sorted[i].label}" (max ${sorted[i].maxAverage}) y "${sorted[i + 1].label}" (min ${sorted[i + 1].minAverage}).`)
        }
      }
    }

    if (errors.length > 0) {
      showToast('error', 'Errores en niveles de madurez', errors.join('\n'))
      return
    }

    const { error } = await supabase
      .from('instrument_versions')
      .update({ maturity_levels: maturityLevelsEdit.length > 0 ? maturityLevelsEdit : null })
      .eq('id', currentVersion.id)

    if (error) {
      showToast('error', 'Error al guardar niveles')
    } else {
      showToast('success', 'Niveles de madurez guardados')
      await loadInstrument()
    }
  }

  // ===================== EXPORTAR A EXCEL =====================
  async function exportToExcel() {
    if (!currentVersion || dimensions.length === 0) return

    const ExcelJS = await import('exceljs')
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
      { header: 'Tipo', key: 'type', width: 10 },
      { header: 'Contribuye al Puntaje', key: 'contributesToScore', width: 20 },
      { header: 'Obligatoria', key: 'isRequired', width: 12 },
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
          type: q.type || 'likert',
          contributesToScore: (q.contributes_to_score !== false) ? 'sí' : 'no',
          isRequired: (q.is_required !== false) ? 'sí' : 'no',
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

    // Hoja 3: Niveles de Madurez
    const wsLevels = wb.addWorksheet('Niveles')
    wsLevels.columns = [
      { header: 'Nivel', key: 'label', width: 20 },
      { header: 'Color', key: 'color', width: 10 },
      { header: 'Promedio Mínimo', key: 'minAverage', width: 18 },
      { header: 'Promedio Máximo', key: 'maxAverage', width: 18 },
    ]
    wsLevels.getRow(1).font = { bold: true }

    const defaultLevels = [
      { label: 'Naciente', color: '#EF4444', minAverage: 1.0, maxAverage: 2.3 },
      { label: 'Base', color: '#F59E0B', minAverage: 2.4, maxAverage: 3.6 },
      { label: 'Clase Mundial', color: '#10B981', minAverage: 3.7, maxAverage: 5.0 },
    ]
    const levelsData = (currentVersion.maturity_levels as any[]) || defaultLevels
    levelsData
      .sort((a: any, b: any) => a.minAverage - b.minAverage)
      .forEach((lvl: any) => {
        wsLevels.addRow({ label: lvl.label, color: lvl.color, minAverage: lvl.minAverage, maxAverage: lvl.maxAverage })
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
      const ExcelJS = await import('exceljs')
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(buffer)

      const ws = wb.getWorksheet('Banco de Preguntas')
        || wb.worksheets.find(s => s.name.toLowerCase().includes('banco'))
        || wb.getWorksheet(1)
      if (!ws) {
        showToast('error', 'No se encontró una hoja con el banco de preguntas en el archivo')
        setImporting(false)
        return
      }

      // Parsear filas (saltar encabezado)
      const parsedDimensions: Record<string, {
        name: string
        description: string
        color: string
        order: number
        questions: { text: string; order: number; type: string; contributes_to_score: boolean; is_required: boolean }[]
      }> = {}

      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // Saltar encabezado

        const dimName = row.getCell(1).value?.toString().trim() || ''
        const dimDesc = row.getCell(2).value?.toString().trim() || ''
        const color = row.getCell(3).value?.toString().trim() || ''
        const dimOrder = Number(row.getCell(4).value) || 0
        const questionText = row.getCell(5).value?.toString().trim() || ''
        const qOrder = Number(row.getCell(6).value) || 0
        // Nuevas columnas (opcionales — retrocompatible)
        const qType = (row.getCell(7).value?.toString().trim().toLowerCase() || 'likert') as 'likert' | 'boolean' | 'text'
        const contributesRaw = row.getCell(8).value?.toString().trim().toLowerCase() || 'sí'
        const requiredRaw = row.getCell(9).value?.toString().trim().toLowerCase() || 'sí'
        const contributesToScore = !['no', 'false', '0'].includes(contributesRaw)
        const isRequired = !['no', 'false', '0'].includes(requiredRaw)

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
        parsedDimensions[dimName].questions.push({
          text: questionText,
          order: qOrder,
          type: ['likert', 'boolean', 'text'].includes(qType) ? qType : 'likert',
          contributes_to_score: contributesToScore,
          is_required: isRequired,
        })
      })

      const dimsArray = Object.values(parsedDimensions)
      if (dimsArray.length === 0) {
        showToast('error', 'No se encontraron datos válidos en el archivo')
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
        showToast('error', 'Errores de validación en el Excel', errors.join('\n'))
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

      // Parsear hoja de Niveles de Madurez (opcional)
      let maturityLevels: { label: string; color: string; minAverage: number; maxAverage: number }[] | null = null
      const wsLevels = wb.getWorksheet('Niveles')
        || wb.worksheets.find(ws => ws.name.toLowerCase().includes('nivel'))
      if (wsLevels) {
        maturityLevels = []
        wsLevels.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return
          const label = row.getCell(1).value?.toString().trim() || ''
          const color = row.getCell(2).value?.toString().trim() || ''
          const minAvg = Number(row.getCell(3).value) || 0
          const maxAvg = Number(row.getCell(4).value) || 0
          if (label && maxAvg > 0) {
            maturityLevels!.push({ label, color, minAverage: minAvg, maxAverage: maxAvg })
          }
        })
        if (maturityLevels.length === 0) {
          maturityLevels = null
        } else {
          // Validar niveles de madurez
          const levelErrors: string[] = []
          const sorted = [...maturityLevels].sort((a, b) => a.minAverage - b.minAverage)

          sorted.forEach((lvl, idx) => {
            // Validar que min < max
            if (lvl.minAverage >= lvl.maxAverage) {
              levelErrors.push(`Nivel "${lvl.label}": el promedio mínimo (${lvl.minAverage}) debe ser menor que el máximo (${lvl.maxAverage}).`)
            }
            // Validar color hex
            if (lvl.color && !/^#[0-9a-fA-F]{6}$/.test(lvl.color)) {
              levelErrors.push(`Nivel "${lvl.label}": color "${lvl.color}" no es hex válido (#RRGGBB).`)
            }
            // Validar que no haya solapamiento con el siguiente nivel
            // Se permite que maxAverage == next.minAverage (rangos contiguos compartiendo borde)
            if (idx < sorted.length - 1) {
              const next = sorted[idx + 1]
              if (lvl.maxAverage > next.minAverage) {
                levelErrors.push(`Niveles "${lvl.label}" y "${next.label}" se solapan (${lvl.maxAverage} > ${next.minAverage}).`)
              }
            }
          })

          // Validar que el rango cubra 1.0 a 5.0
          if (sorted[0].minAverage > 1.0) {
            levelErrors.push(`El primer nivel ("${sorted[0].label}") no cubre desde 1.0 (empieza en ${sorted[0].minAverage}).`)
          }
          if (sorted[sorted.length - 1].maxAverage < 5.0) {
            levelErrors.push(`El último nivel ("${sorted[sorted.length - 1].label}") no cubre hasta 5.0 (termina en ${sorted[sorted.length - 1].maxAverage}).`)
          }

          // Validar huecos entre niveles (permitir rangos contiguos donde max == next.min)
          for (let i = 0; i < sorted.length - 1; i++) {
            const gap = sorted[i + 1].minAverage - sorted[i].maxAverage
            if (gap > 0.2) {
              levelErrors.push(`Hueco entre "${sorted[i].label}" (max ${sorted[i].maxAverage}) y "${sorted[i + 1].label}" (min ${sorted[i + 1].minAverage}).`)
            }
          }

          if (levelErrors.length > 0) {
            showToast('error', 'Errores en Niveles de Madurez', levelErrors.join('\n'))
            setImporting(false)
            return
          }
        }
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
            maturity_levels: maturityLevels,
          })
          .select('id')
          .single()

        if (!newVersion) {
          showToast('error', 'Error al crear nueva versión')
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
            .update({ scale_labels: scaleLabels, maturity_levels: maturityLevels })
            .eq('id', currentVersion.id)
        }
      }

      // Insertar dimensiones y preguntas (con rollback si falla)
      let insertedDims = 0
      let insertedQuestions = 0
      const insertedDimIds: string[] = []

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
          // Rollback: eliminar dimensiones ya insertadas
          if (insertedDimIds.length > 0) {
            await supabase.from('questions').delete().in('dimension_id', insertedDimIds)
            await supabase.from('dimensions').delete().in('id', insertedDimIds)
          }
          showToast('error', `Error insertando dimensión "${dim.name}"`, 'Se revirtieron los cambios.')
          setImporting(false)
          await loadInstrument()
          return
        }

        if (newDim) {
          insertedDimIds.push(newDim.id)
          insertedDims++
          const questionsToInsert = dim.questions.map(q => ({
            dimension_id: newDim.id,
            text: q.text,
            display_order: q.order,
            type: q.type || 'likert',
            contributes_to_score: q.contributes_to_score !== false,
            is_required: q.is_required !== false,
          }))
          const { error: qError } = await supabase.from('questions').insert(questionsToInsert)
          if (qError) {
            // Rollback completo
            await supabase.from('questions').delete().in('dimension_id', insertedDimIds)
            await supabase.from('dimensions').delete().in('id', insertedDimIds)
            showToast('error', `Error insertando preguntas de "${dim.name}"`, 'Se revirtieron los cambios.')
            setImporting(false)
            await loadInstrument()
            return
          }
          insertedQuestions += dim.questions.length
        }
      }

      if (insertedDims === 0) {
        showToast('error', 'No se pudieron insertar las dimensiones', 'Verifica permisos de la base de datos.')
      } else {
        showToast('success', `Importación exitosa: ${insertedDims} dimensiones, ${insertedQuestions} preguntas`)
      }
      await loadInstrument()
    } catch (err) {
      showToast('error', 'Error al procesar el archivo Excel')
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

      {/* Visibilidad del instrumento */}
      {(() => {
        const isSuperAdmin = userRole === 'super_admin'
        const isOwner = userId === (instrument as any).owner_id
        const canChangeVisibility = isSuperAdmin || isOwner
        const isTemplate = (instrument as any).visibility === 'template'

        // Si es template y el usuario no es super_admin, no puede modificar
        if (isTemplate && !isSuperAdmin) {
          return (
            <div className="mb-4 flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Visibilidad:</label>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Template</span>
              <span className="text-xs text-gray-500">Solo super admin puede modificar templates</span>
            </div>
          )
        }

        return canChangeVisibility ? (
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Visibilidad:</label>
            <select
              value={(instrument as any).visibility || 'public'}
              onChange={async (e) => {
                const { error } = await supabase
                  .from('instruments')
                  .update({ visibility: e.target.value })
                  .eq('id', instrumentId)
                if (error) {
                  showToast('error', 'Error al cambiar visibilidad')
                } else {
                  showToast('success', `Visibilidad cambiada a "${e.target.value}"`)
                  setInstrument(prev => prev ? { ...prev, visibility: e.target.value } as any : prev)
                }
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="public">Público (visible para todas las áreas)</option>
              <option value="private">Privado (solo mi área)</option>
              {isSuperAdmin && (
                <option value="template">Template (base para duplicar)</option>
              )}
            </select>
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Visibilidad:</label>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              (instrument as any).visibility === 'private' ? 'bg-gray-100 text-gray-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {(instrument as any).visibility === 'private' ? 'Privado' : 'Público'}
            </span>
            <span className="text-xs text-gray-500">Solo el propietario o super admin puede cambiar la visibilidad</span>
          </div>
        )
      })()}

      {instrument.ai_expertise_prompt && !editingPrompt && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-indigo-600">🤖 Expertise IA</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPromptExpanded(!promptExpanded)}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                {promptExpanded ? 'Colapsar' : 'Expandir'}
              </button>
              <button
                onClick={() => { setEditingPrompt(true); setPromptValue(instrument.ai_expertise_prompt || '') }}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Editar
              </button>
            </div>
          </div>
          {promptExpanded ? (
            <div className="max-w-none text-indigo-900 text-sm [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_li]:mb-0.5 [&_strong]:font-bold [&_hr]:my-3 [&_hr]:border-indigo-200">
              <ReactMarkdown>{instrument.ai_expertise_prompt}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-indigo-900 line-clamp-3">{instrument.ai_expertise_prompt}</p>
          )}
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
            rows={12}
            placeholder="Ej: Eres un consultor experto en transformación digital y adopción de IA..."
            className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                await supabase
                  .from('instruments')
                  .update({ ai_expertise_prompt: promptValue.trim() || null })
                  .eq('id', instrumentId)
                await loadInstrument()
                setEditingPrompt(false)
                setPromptExpanded(true)
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

        {/* Vista previa del banco con edición inline */}
        {dimensions.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin dimensiones. Importa un Excel o agrega manualmente.</p>
        ) : (
          <div className="space-y-4">
            {dimensions.map((dim, dimIdx) => (
              <div key={dim.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="color"
                    defaultValue={dim.color || '#6B7280'}
                    onBlur={e => updateDimensionColor(dim.id, e.target.value)}
                    className="w-5 h-5 rounded-full border border-gray-300 cursor-pointer p-0 overflow-hidden"
                    title="Cambiar color"
                    style={{ appearance: 'none', WebkitAppearance: 'none' }}
                  />
                  <span className="text-xs text-gray-400 font-mono w-5">{dim.display_order}.</span>
                  <input
                    type="text"
                    defaultValue={dim.name}
                    onBlur={e => updateDimensionName(dim.id, e.target.value)}
                    className="font-bold text-gray-900 flex-1 px-2 py-0.5 border border-transparent hover:border-gray-300 focus:border-blue-400 rounded text-sm focus:outline-none"
                  />
                  <span className="text-xs text-gray-400">{dim.questions.length} preg.</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveDimension(dim.id, 'up')}
                      disabled={dimIdx === 0}
                      className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      title="Subir"
                    >▲</button>
                    <button
                      onClick={() => moveDimension(dim.id, 'down')}
                      disabled={dimIdx === dimensions.length - 1}
                      className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      title="Bajar"
                    >▼</button>
                  </div>
                  <button
                    onClick={() => deleteDimension(dim.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                    title="Eliminar dimensión"
                  >
                    ✕
                  </button>
                </div>
                {dim.description !== undefined && (
                  <input
                    type="text"
                    defaultValue={dim.description || ''}
                    onBlur={e => updateDimensionDescription(dim.id, e.target.value)}
                    placeholder="Descripción de la dimensión (opcional)"
                    className="text-sm text-gray-500 mb-2 w-full px-2 py-0.5 border border-transparent hover:border-gray-300 focus:border-blue-400 rounded focus:outline-none"
                  />
                )}
                <ul className="space-y-2 pl-4">
                  {dim.questions.map((q, qIdx) => (
                    <li key={q.id} className="text-sm text-gray-700 group">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 mr-1 font-mono text-xs w-4">{q.display_order}.</span>
                        <input
                          type="text"
                          defaultValue={q.text}
                          onBlur={e => updateQuestionText(q.id, e.target.value)}
                          className="flex-1 px-2 py-0.5 border border-transparent hover:border-gray-300 focus:border-blue-400 rounded text-sm focus:outline-none"
                        />
                        {/* Tipo badge */}
                        <select
                          defaultValue={q.type || 'likert'}
                          onChange={e => updateQuestionField(q.id, 'type', e.target.value)}
                          className="text-xs border border-gray-200 rounded px-1 py-0.5 text-gray-500 bg-gray-50"
                          title="Tipo de pregunta"
                        >
                          <option value="likert">Likert</option>
                          <option value="boolean">Sí/No</option>
                          <option value="text">Texto</option>
                        </select>
                        <div className="flex gap-1 ml-auto">
                          <button
                            onClick={() => moveQuestion(q.id, dim.id, 'up')}
                            disabled={qIdx === 0}
                            className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
                            title="Subir"
                          >▲</button>
                          <button
                            onClick={() => moveQuestion(q.id, dim.id, 'down')}
                            disabled={qIdx === dim.questions.length - 1}
                            className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
                            title="Bajar"
                          >▼</button>
                          <button
                            onClick={() => deleteQuestion(q.id, dim.id)}
                            className="text-xs text-red-400 hover:text-red-600"
                            title="Eliminar"
                          >✕</button>
                        </div>
                      </div>
                      {/* Opciones: tipo + contribuye al puntaje + obligatoria */}
                      <div className="flex flex-wrap gap-3 ml-6 mt-1">
                        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked={q.contributes_to_score !== false}
                            onChange={e => updateQuestionField(q.id, 'contributes_to_score', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 w-3 h-3"
                          />
                          Contribuye al puntaje
                        </label>
                        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked={q.is_required !== false}
                            onChange={e => updateQuestionField(q.id, 'is_required', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 w-3 h-3"
                          />
                          Obligatoria
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => addQuestion(dim.id, dim.questions.length + 1)}
                  className="mt-2 text-xs text-blue-500 hover:text-blue-700"
                >
                  + Agregar pregunta
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Agregar nueva dimensión */}
        <button
          onClick={addDimension}
          className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          + Agregar Dimensión
        </button>
      </div>

      {/* Editor de Escala */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Escala de Valores (1-5)</h2>
        <p className="text-xs text-gray-500 mb-4">Define las etiquetas que verá el encuestado para cada valor.</p>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(val => {
            const current = currentVersion?.scale_labels as any[] | null
            const existing = current?.find((s: any) => s.value === val)
            return (
              <div key={val} className="flex items-center gap-3">
                <span className="w-6 text-center font-bold text-gray-700">{val}</span>
                <input
                  type="text"
                  defaultValue={existing?.label || ''}
                  placeholder={val === 1 ? 'Totalmente en desacuerdo' : val === 5 ? 'Totalmente de acuerdo' : `Nivel ${val}`}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  id={`scale-label-${val}`}
                />
                <input
                  type="text"
                  defaultValue={existing?.description || ''}
                  placeholder="Descripción (opcional)"
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  id={`scale-desc-${val}`}
                />
              </div>
            )
          })}
        </div>
        <button
          onClick={saveScaleLabels}
          className="mt-4 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Guardar Escala
        </button>
      </div>

      {/* Editor de Niveles de Madurez */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Niveles de Madurez</h2>
        <p className="text-xs text-gray-500 mb-4">Define los umbrales y nombres de los niveles de evaluación.</p>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
            <span className="col-span-4">Nivel</span>
            <span className="col-span-2">Color</span>
            <span className="col-span-2">Prom. Min</span>
            <span className="col-span-2">Prom. Max</span>
            <span className="col-span-2"></span>
          </div>
          {maturityLevelsEdit.map((lvl, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={lvl.label}
                onChange={e => updateMaturityLevel(idx, 'label', e.target.value)}
                placeholder="Nombre"
                className="col-span-4 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="text"
                value={lvl.color}
                onChange={e => updateMaturityLevel(idx, 'color', e.target.value)}
                placeholder="#RRGGBB"
                className="col-span-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                step="0.1"
                value={lvl.minAverage}
                onChange={e => updateMaturityLevel(idx, 'minAverage', parseFloat(e.target.value) || 0)}
                className="col-span-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                step="0.1"
                value={lvl.maxAverage}
                onChange={e => updateMaturityLevel(idx, 'maxAverage', parseFloat(e.target.value) || 0)}
                className="col-span-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={() => removeMaturityLevel(idx)}
                className="col-span-2 text-xs text-red-400 hover:text-red-600"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={addMaturityLevel}
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            + Agregar Nivel
          </button>
          <button
            onClick={saveMaturityLevels}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Guardar Niveles
          </button>
        </div>
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

      {/* Modal para agregar dimensión/pregunta */}
      <PromptModal
        isOpen={!!promptModal}
        title={promptModal?.type === 'dimension' ? 'Nueva Dimensión' : 'Nueva Pregunta'}
        placeholder={promptModal?.type === 'dimension' ? 'Nombre de la dimensión' : 'Texto de la pregunta'}
        onConfirm={(value) => {
          if (promptModal?.type === 'dimension') confirmAddDimension(value)
          else confirmAddQuestion(value)
        }}
        onCancel={() => setPromptModal(null)}
      />
    </div>
  )
}



