export interface Session {
  id: string
  name: string
  is_active: boolean
  instrument_version_id: string | null
  created_at: string
}

export interface Instrument {
  id: string
  name: string
  description: string | null
  ai_expertise_prompt: string | null
  is_active: boolean
  created_at: string
}

export interface InstrumentVersion {
  id: string
  instrument_id: string
  version_number: number
  version_tag: string
  is_current: boolean
  notes: string | null
  scale_labels: ScaleLabel[] | null
  maturity_levels: MaturityLevel[] | null
  created_at: string
}

export interface ScaleLabel {
  value: number
  label: string
  description?: string
}

export interface MaturityLevel {
  label: string
  color: string
  minAverage: number
  maxAverage: number
}

export interface InstrumentWithVersion extends Instrument {
  current_version?: InstrumentVersion
}

export interface SessionWithInstrument extends Session {
  instrument_versions?: {
    version_tag: string
    instruments: {
      name: string
    }
  } | null
}

export interface Dimension {
  id: string
  name: string
  description: string | null
  display_order: number
  color: string | null
  instrument_version_id: string | null
}

export interface Question {
  id: string
  dimension_id: string
  text: string
  display_order: number
}

export interface DimensionWithQuestions extends Dimension {
  questions: Question[]
}

export interface Respondent {
  id: string
  session_id: string
  name: string
  email: string
  completed: boolean
  completed_at: string | null
  created_at: string
}

export interface Response {
  id: string
  respondent_id: string
  question_id: string
  value: number
  created_at: string
}

// Escala de acuerdo
export const AGREEMENT_SCALE = [
  { value: 5, label: 'Totalmente de acuerdo' },
  { value: 4, label: 'De acuerdo' },
  { value: 3, label: 'Depende / Neutral' },
  { value: 2, label: 'En desacuerdo' },
  { value: 1, label: 'Totalmente en desacuerdo' },
] as const

// Nivel de madurez por dimensión (dinámico según cantidad de preguntas)
export function getDimensionMaturityLevel(total: number, questionCount: number = 6): { level: string; color: string } {
  const min = questionCount
  const max = questionCount * 5
  const range = max - min
  const thirdLow = min + Math.floor(range / 3)
  const thirdHigh = min + Math.floor((range * 2) / 3)

  if (total <= thirdLow) return { level: 'Naciente', color: '#EF4444' }
  if (total <= thirdHigh) return { level: 'Base', color: '#F59E0B' }
  return { level: 'Clase Mundial', color: '#10B981' }
}

// Nivel de madurez global (dinámico según total de preguntas)
export function getMaturityLevel(total: number, totalQuestions: number = 48): { level: string; color: string } {
  const min = totalQuestions
  const max = totalQuestions * 5
  const range = max - min
  const thirdLow = min + Math.floor(range / 3)
  const thirdHigh = min + Math.floor((range * 2) / 3)

  if (total <= thirdLow) return { level: 'Naciente', color: '#EF4444' }
  if (total <= thirdHigh) return { level: 'Base', color: '#F59E0B' }
  return { level: 'Clase Mundial', color: '#10B981' }
}
