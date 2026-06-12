/**
 * Aplica filtros de fecha y sesiones seleccionadas a los datos de tendencia.
 * Función pura — no depende de estado externo.
 */

import { TrendDataPoint } from './transformTrendData'

export interface TrendFilterState {
  dateFrom: string | null
  dateTo: string | null
  selectedSessions: Set<string>
}

export function filterTrendData(
  dataPoints: TrendDataPoint[],
  filters: TrendFilterState
): TrendDataPoint[] {
  return dataPoints.filter(point => {
    // Filtro por sesiones seleccionadas
    if (filters.selectedSessions.size > 0 && !filters.selectedSessions.has(point.sessionId)) {
      return false
    }

    // Filtro por fecha desde
    if (filters.dateFrom) {
      const pointDate = new Date(point.sessionDate)
      const fromDate = new Date(filters.dateFrom)
      if (pointDate < fromDate) return false
    }

    // Filtro por fecha hasta
    if (filters.dateTo) {
      const pointDate = new Date(point.sessionDate)
      const toDate = new Date(filters.dateTo)
      // Incluir el día completo
      toDate.setHours(23, 59, 59, 999)
      if (pointDate > toDate) return false
    }

    return true
  })
}
