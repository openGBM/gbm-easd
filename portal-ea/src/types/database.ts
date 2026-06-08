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
  created_at: string
}

export interface ScaleLabel {
  value: number
  label: string
  description?: string
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

// Niveles de madurez (8 dimensiones × 6 preguntas × max 5 = 240 max, min = 48)
// Rangos ajustados para 48 preguntas:
// Naciente: 48-112, Base: 113-176, Clase Mundial: 177-240
export function getMaturityLevel(total: number): { level: string; color: string } {
  if (total <= 112) return { level: 'Naciente', color: '#EF4444' }
  if (total <= 176) return { level: 'Base', color: '#F59E0B' }
  return { level: 'Clase Mundial', color: '#10B981' }
}

// Nivel de madurez por dimensión (6 preguntas × max 5 = 30, min = 6)
export function getDimensionMaturityLevel(total: number): { level: string; color: string } {
  if (total <= 13) return { level: 'Naciente', color: '#EF4444' }
  if (total <= 23) return { level: 'Base', color: '#F59E0B' }
  return { level: 'Clase Mundial', color: '#10B981' }
}
