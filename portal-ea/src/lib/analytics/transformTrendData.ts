/**
 * Transforma datos raw de Supabase en formato genérico para gráficos de tendencias.
 * Principio RNF-A04: interfaces genéricas, no acopladas a escala 1-5.
 */

export interface RawTrendRow {
  session_id: string
  session_name: string
  session_date: string
  dimension_name: string
  dimension_order: number
  dimension_color: string | null
  avg_value: number
}

export interface TrendDataPoint {
  sessionId: string
  sessionName: string
  sessionDate: string
  generalAvg: number
  dimensionAvgs: Record<string, number>
}

export interface DimensionInfo {
  name: string
  color: string
  order: number
}

export interface TrendResult {
  dataPoints: TrendDataPoint[]
  dimensions: DimensionInfo[]
}

export function transformTrendData(rawData: RawTrendRow[]): TrendResult {
  if (rawData.length === 0) {
    return { dataPoints: [], dimensions: [] }
  }

  // Extraer dimensiones únicas
  const dimensionMap = new Map<string, DimensionInfo>()
  rawData.forEach(row => {
    if (!dimensionMap.has(row.dimension_name)) {
      dimensionMap.set(row.dimension_name, {
        name: row.dimension_name,
        color: row.dimension_color || '#6B7280',
        order: row.dimension_order,
      })
    }
  })

  const dimensions = Array.from(dimensionMap.values()).sort((a, b) => a.order - b.order)

  // Agrupar por sesión
  const sessionMap = new Map<string, {
    sessionId: string
    sessionName: string
    sessionDate: string
    values: number[]
    dimensionAvgs: Record<string, number>
  }>()

  rawData.forEach(row => {
    if (!sessionMap.has(row.session_id)) {
      sessionMap.set(row.session_id, {
        sessionId: row.session_id,
        sessionName: row.session_name,
        sessionDate: row.session_date,
        values: [],
        dimensionAvgs: {},
      })
    }
    const entry = sessionMap.get(row.session_id)!
    entry.values.push(row.avg_value)
    entry.dimensionAvgs[row.dimension_name] = Math.round(row.avg_value * 10) / 10
  })

  // Construir data points ordenados por fecha
  const dataPoints: TrendDataPoint[] = Array.from(sessionMap.values())
    .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
    .map(entry => ({
      sessionId: entry.sessionId,
      sessionName: entry.sessionName,
      sessionDate: entry.sessionDate,
      generalAvg: Math.round((entry.values.reduce((s, v) => s + v, 0) / entry.values.length) * 10) / 10,
      dimensionAvgs: entry.dimensionAvgs,
    }))

  return { dataPoints, dimensions }
}
