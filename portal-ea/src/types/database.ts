export interface Session {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface Dimension {
  id: string
  name: string
  description: string | null
  display_order: number
}

export interface Respondent {
  id: string
  session_id: string
  name: string
  email: string
  completed: boolean
  created_at: string
}

export interface Response {
  id: string
  respondent_id: string
  dimension_id: string
  value: number
  created_at: string
}

// Tipos auxiliares
export interface ResponseWithDimension extends Response {
  dimensions: Dimension
}

export interface RespondentWithResponses extends Respondent {
  responses: ResponseWithDimension[]
}

// Escala de acuerdo
export const AGREEMENT_SCALE = [
  { value: 1, label: 'Totalmente en desacuerdo' },
  { value: 2, label: 'En desacuerdo' },
  { value: 3, label: 'Depende / Neutral' },
  { value: 4, label: 'De acuerdo' },
  { value: 5, label: 'Totalmente de acuerdo' },
] as const

// Niveles de madurez
export function getMaturityLevel(total: number): { level: string; color: string } {
  if (total <= 13) return { level: 'Naciente', color: '#EF4444' }
  if (total <= 23) return { level: 'Base', color: '#F59E0B' }
  return { level: 'Clase Mundial', color: '#10B981' }
}
