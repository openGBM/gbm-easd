/**
 * Transforma datos raw del historial de un encuestado en formato para tabla y radares.
 * Principio RNF-A04: interfaces genéricas, no acopladas a escala 1-5.
 */

import { getMaturityLevel } from '@/types/database'

export interface RawHistoryRow {
  session_id: string
  session_name: string
  session_date: string
  dimension_name: string
  dimension_order: number
  dimension_color: string | null
  avg_value: number
  total_value: number
  question_count: number
  instrument_name?: string
  version_tag?: string
}

export interface RespondentSession {
  sessionId: string
  sessionName: string
  date: string
  totalScore: number
  maxScore: number
  questionCount: number
  maturityLevel: string
  maturityColor: string
  instrumentName?: string
  versionTag?: string
}

export interface RespondentRadarData {
  sessionId: string
  sessionName: string
  date: string
  data: { dimension: string; value: number }[]
}

export interface RespondentHistoryResult {
  table: RespondentSession[]
  radars: RespondentRadarData[]
}

export function transformRespondentHistory(rawData: RawHistoryRow[]): RespondentHistoryResult {
  if (rawData.length === 0) {
    return { table: [], radars: [] }
  }

  // Agrupar por sesión
  const sessionMap = new Map<string, {
    sessionId: string
    sessionName: string
    date: string
    dimensions: { name: string; avgValue: number; totalValue: number; order: number }[]
    totalScore: number
    totalQuestions: number
    instrumentName?: string
    versionTag?: string
  }>()

  rawData.forEach(row => {
    if (!sessionMap.has(row.session_id)) {
      sessionMap.set(row.session_id, {
        sessionId: row.session_id,
        sessionName: row.session_name,
        date: row.session_date,
        dimensions: [],
        totalScore: 0,
        totalQuestions: 0,
        instrumentName: row.instrument_name,
        versionTag: row.version_tag,
      })
    }
    const entry = sessionMap.get(row.session_id)!
    entry.dimensions.push({
      name: row.dimension_name,
      avgValue: Math.round(row.avg_value * 10) / 10,
      totalValue: row.total_value,
      order: row.dimension_order,
    })
    entry.totalScore += row.total_value
    entry.totalQuestions += row.question_count
  })

  // Ordenar sesiones por fecha
  const sortedSessions = Array.from(sessionMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Generar tabla
  const table: RespondentSession[] = sortedSessions.map(session => {
    const maxScore = session.totalQuestions * 5
    const { level, color } = getMaturityLevel(session.totalScore, session.totalQuestions)
    return {
      sessionId: session.sessionId,
      sessionName: session.sessionName,
      date: session.date,
      totalScore: session.totalScore,
      maxScore,
      questionCount: session.totalQuestions,
      maturityLevel: level,
      maturityColor: color,
      instrumentName: session.instrumentName,
      versionTag: session.versionTag,
    }
  })

  // Generar radares (uno por sesión)
  const radars: RespondentRadarData[] = sortedSessions.map(session => ({
    sessionId: session.sessionId,
    sessionName: session.sessionName,
    date: session.date,
    data: session.dimensions
      .sort((a, b) => a.order - b.order)
      .map(d => ({ dimension: d.name, value: d.avgValue })),
  }))

  return { table, radars }
}
