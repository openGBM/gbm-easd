import { describe, it, expect } from 'vitest'
import { getDimensionMaturityLevel, getMaturityLevel } from '@/types/database'

describe('getDimensionMaturityLevel', () => {
  it('calcula Naciente para valores bajos con 6 preguntas', () => {
    const result = getDimensionMaturityLevel(8, 6)
    expect(result.level).toBe('Naciente')
    expect(result.color).toBe('#EF4444')
  })

  it('calcula Base para valores medios con 6 preguntas', () => {
    const result = getDimensionMaturityLevel(18, 6)
    expect(result.level).toBe('Base')
    expect(result.color).toBe('#F59E0B')
  })

  it('calcula Clase Mundial para valores altos con 6 preguntas', () => {
    const result = getDimensionMaturityLevel(27, 6)
    expect(result.level).toBe('Clase Mundial')
    expect(result.color).toBe('#10B981')
  })

  it('se adapta a 5 preguntas (min=5, max=25)', () => {
    // Tercios: 5-11 Naciente, 12-18 Base, 19-25 Clase Mundial
    expect(getDimensionMaturityLevel(5, 5).level).toBe('Naciente')
    expect(getDimensionMaturityLevel(11, 5).level).toBe('Naciente')
    expect(getDimensionMaturityLevel(12, 5).level).toBe('Base')
    expect(getDimensionMaturityLevel(19, 5).level).toBe('Clase Mundial')
  })

  it('se adapta a 4 preguntas (min=4, max=20)', () => {
    expect(getDimensionMaturityLevel(4, 4).level).toBe('Naciente')
    expect(getDimensionMaturityLevel(15, 4).level).toBe('Clase Mundial')
  })

  it('usa 6 preguntas por defecto si no se especifica', () => {
    const result = getDimensionMaturityLevel(18)
    expect(result.level).toBe('Base')
  })
})

describe('getMaturityLevel', () => {
  it('calcula nivel global con 48 preguntas (8 dimensiones × 6)', () => {
    // min=48, max=240, rango=192, tercio=64
    // Naciente: 48-112, Base: 113-176, Clase Mundial: 177-240
    expect(getMaturityLevel(80, 48).level).toBe('Naciente')
    expect(getMaturityLevel(150, 48).level).toBe('Base')
    expect(getMaturityLevel(200, 48).level).toBe('Clase Mundial')
  })

  it('calcula nivel global con 23 preguntas', () => {
    // min=23, max=115, rango=92, tercio≈30
    // Naciente: 23-53, Base: 54-84, Clase Mundial: 85-115
    expect(getMaturityLevel(40, 23).level).toBe('Naciente')
    expect(getMaturityLevel(70, 23).level).toBe('Base')
    expect(getMaturityLevel(100, 23).level).toBe('Clase Mundial')
  })
})
