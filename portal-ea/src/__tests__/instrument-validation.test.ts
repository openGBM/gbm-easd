import { describe, it, expect } from 'vitest'
import { MaturityLevel, ScaleLabel } from '@/types/database'

// Simular la lógica de validación de niveles (extraída del import)
function validateMaturityLevels(levels: MaturityLevel[]): string[] {
  const errors: string[] = []
  const sorted = [...levels].sort((a, b) => a.minAverage - b.minAverage)

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
  }

  return errors
}

// Simular getCustomLevel (extraída del ResultsTable)
function getCustomLevel(avg: number, maturityLevels: MaturityLevel[] | null): { level: string; color: string } {
  if (maturityLevels && maturityLevels.length > 0) {
    const sorted = [...maturityLevels].sort((a, b) => a.minAverage - b.minAverage)
    for (const lvl of sorted) {
      if (avg >= lvl.minAverage && avg <= lvl.maxAverage) {
        return { level: lvl.label, color: lvl.color }
      }
    }
    let closest = sorted[0]
    let minDist = Infinity
    for (const lvl of sorted) {
      const dist = Math.min(Math.abs(avg - lvl.minAverage), Math.abs(avg - lvl.maxAverage))
      if (dist < minDist) {
        minDist = dist
        closest = lvl
      }
    }
    return { level: closest.label, color: closest.color }
  }
  if (avg < 2.4) return { level: 'Naciente', color: '#EF4444' }
  if (avg < 3.7) return { level: 'Base', color: '#F59E0B' }
  return { level: 'Clase Mundial', color: '#10B981' }
}

describe('Validación de Niveles de Madurez', () => {
  it('acepta niveles válidos con 3 niveles estándar', () => {
    const levels: MaturityLevel[] = [
      { label: 'Naciente', color: '#EF4444', minAverage: 1.0, maxAverage: 2.3 },
      { label: 'Base', color: '#F59E0B', minAverage: 2.4, maxAverage: 3.6 },
      { label: 'Clase Mundial', color: '#10B981', minAverage: 3.7, maxAverage: 5.0 },
    ]
    expect(validateMaturityLevels(levels)).toEqual([])
  })

  it('acepta niveles válidos con 4 niveles', () => {
    const levels: MaturityLevel[] = [
      { label: 'Crítico', color: '#EF4444', minAverage: 1.0, maxAverage: 2.0 },
      { label: 'Inicial', color: '#F97316', minAverage: 2.1, maxAverage: 3.0 },
      { label: 'En progreso', color: '#F59E0B', minAverage: 3.1, maxAverage: 4.0 },
      { label: 'Optimizado', color: '#10B981', minAverage: 4.1, maxAverage: 5.0 },
    ]
    expect(validateMaturityLevels(levels)).toEqual([])
  })

  it('rechaza cuando min >= max', () => {
    const levels: MaturityLevel[] = [
      { label: 'Malo', color: '#EF4444', minAverage: 3.0, maxAverage: 2.0 },
      { label: 'Bueno', color: '#10B981', minAverage: 3.1, maxAverage: 5.0 },
    ]
    const errors = validateMaturityLevels(levels)
    expect(errors.some(e => e.includes('debe ser menor que máx'))).toBe(true)
  })

  it('rechaza niveles solapados', () => {
    const levels: MaturityLevel[] = [
      { label: 'Bajo', color: '#EF4444', minAverage: 1.0, maxAverage: 3.0 },
      { label: 'Alto', color: '#10B981', minAverage: 2.5, maxAverage: 5.0 },
    ]
    const errors = validateMaturityLevels(levels)
    expect(errors.some(e => e.includes('se solapan'))).toBe(true)
  })

  it('acepta niveles contiguos que comparten borde (max == next.min)', () => {
    const levels: MaturityLevel[] = [
      { label: 'Bajo', color: '#EF4444', minAverage: 1.0, maxAverage: 2.5 },
      { label: 'Medio', color: '#F59E0B', minAverage: 2.5, maxAverage: 3.5 },
      { label: 'Alto', color: '#10B981', minAverage: 3.5, maxAverage: 5.0 },
    ]
    const errors = validateMaturityLevels(levels)
    expect(errors).toEqual([])
  })

  it('rechaza si no cubre desde 1.0', () => {
    const levels: MaturityLevel[] = [
      { label: 'Medio', color: '#F59E0B', minAverage: 2.0, maxAverage: 3.5 },
      { label: 'Alto', color: '#10B981', minAverage: 3.6, maxAverage: 5.0 },
    ]
    const errors = validateMaturityLevels(levels)
    expect(errors.some(e => e.includes('no cubre desde 1.0'))).toBe(true)
  })

  it('rechaza si no cubre hasta 5.0', () => {
    const levels: MaturityLevel[] = [
      { label: 'Bajo', color: '#EF4444', minAverage: 1.0, maxAverage: 2.5 },
      { label: 'Medio', color: '#F59E0B', minAverage: 2.6, maxAverage: 4.0 },
    ]
    const errors = validateMaturityLevels(levels)
    expect(errors.some(e => e.includes('no cubre hasta 5.0'))).toBe(true)
  })

  it('rechaza color inválido', () => {
    const levels: MaturityLevel[] = [
      { label: 'Bajo', color: 'rojo', minAverage: 1.0, maxAverage: 2.5 },
      { label: 'Alto', color: '#10B981', minAverage: 2.6, maxAverage: 5.0 },
    ]
    const errors = validateMaturityLevels(levels)
    expect(errors.some(e => e.includes('color inválido'))).toBe(true)
  })

  it('rechaza nivel sin nombre', () => {
    const levels: MaturityLevel[] = [
      { label: '', color: '#EF4444', minAverage: 1.0, maxAverage: 2.5 },
      { label: 'Alto', color: '#10B981', minAverage: 2.6, maxAverage: 5.0 },
    ]
    const errors = validateMaturityLevels(levels)
    expect(errors.some(e => e.includes('falta nombre'))).toBe(true)
  })
})

describe('getCustomLevel con niveles personalizados', () => {
  const customLevels: MaturityLevel[] = [
    { label: 'Crítico', color: '#EF4444', minAverage: 1.0, maxAverage: 2.0 },
    { label: 'Inicial', color: '#F97316', minAverage: 2.1, maxAverage: 3.0 },
    { label: 'En progreso', color: '#F59E0B', minAverage: 3.1, maxAverage: 4.0 },
    { label: 'Optimizado', color: '#10B981', minAverage: 4.1, maxAverage: 5.0 },
  ]

  it('asigna Crítico para promedio 1.5', () => {
    expect(getCustomLevel(1.5, customLevels).level).toBe('Crítico')
  })

  it('asigna Inicial para promedio 2.5', () => {
    expect(getCustomLevel(2.5, customLevels).level).toBe('Inicial')
  })

  it('asigna En progreso para promedio 3.5', () => {
    expect(getCustomLevel(3.5, customLevels).level).toBe('En progreso')
  })

  it('asigna Optimizado para promedio 4.5', () => {
    expect(getCustomLevel(4.5, customLevels).level).toBe('Optimizado')
  })

  it('asigna nivel más cercano si cae en hueco', () => {
    // Gap entre 2.0 y 2.1 — debería asignar el más cercano
    const result = getCustomLevel(2.05, customLevels)
    expect(['Crítico', 'Inicial']).toContain(result.level)
  })

  it('usa defaults si maturityLevels es null', () => {
    expect(getCustomLevel(1.5, null).level).toBe('Naciente')
    expect(getCustomLevel(2.4, null).level).toBe('Base')
    expect(getCustomLevel(4.0, null).level).toBe('Clase Mundial')
  })

  it('2.4 es Base (no Naciente) con defaults', () => {
    expect(getCustomLevel(2.4, null).level).toBe('Base')
  })

  it('3.7 es Clase Mundial con defaults', () => {
    expect(getCustomLevel(3.7, null).level).toBe('Clase Mundial')
  })
})

describe('Validación de Scale Labels', () => {
  it('acepta escala válida con 5 valores', () => {
    const labels: ScaleLabel[] = [
      { value: 1, label: 'Nada' },
      { value: 2, label: 'Incipiente' },
      { value: 3, label: 'En desarrollo' },
      { value: 4, label: 'Establecido' },
      { value: 5, label: 'Maduro' },
    ]
    expect(labels.length).toBe(5)
    expect(labels.every(l => l.value >= 1 && l.value <= 5)).toBe(true)
    expect(labels.every(l => l.label.trim().length > 0)).toBe(true)
  })

  it('los valores deben ser únicos', () => {
    const labels: ScaleLabel[] = [
      { value: 1, label: 'A' },
      { value: 2, label: 'B' },
      { value: 3, label: 'C' },
      { value: 4, label: 'D' },
      { value: 5, label: 'E' },
    ]
    const values = labels.map(l => l.value)
    const uniqueValues = new Set(values)
    expect(uniqueValues.size).toBe(values.length)
  })
})
