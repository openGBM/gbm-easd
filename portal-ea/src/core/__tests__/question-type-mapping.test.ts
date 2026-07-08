import { describe, it, expect, vi } from 'vitest'
import { SupabaseDimensionRepository } from '../adapters/supabase/repositories/dimension.repository'
import { isOk } from '../errors/result'

/**
 * Tests para el mapeo correcto del tipo de pregunta.
 *
 * BUG: Las preguntas de tipo 'text' (feedback abierto) se mostraban como Likert (escala 1-5).
 * CAUSA: mapToDimensionWithQuestions no incluía los campos type, is_required, contributes_to_score.
 * FIX: Incluir estos campos en el mapping de questions.
 */
describe('DimensionRepository — Mapeo de tipo de pregunta', () => {
  function createMockClientWithDimensions(dimensions: any[]) {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }
    const queryPromise = Promise.resolve({ data: dimensions, error: null })
    Object.assign(mockQuery, { then: queryPromise.then.bind(queryPromise) })

    return { from: vi.fn().mockReturnValue(mockQuery) }
  }

  it('preguntas de tipo text se mapean correctamente (no como likert)', async () => {
    const dimensions = [{
      id: 'd1',
      name: 'Feedback',
      description: 'Ayúdanos a mejorar',
      display_order: 6,
      color: '#666',
      instrument_version_id: 'ver-1',
      questions: [
        { id: 'q1', dimension_id: 'd1', text: '¿Qué te hubiera ayudado más?', display_order: 1, type: 'text', is_required: false, contributes_to_score: false },
        { id: 'q2', dimension_id: 'd1', text: '¿Qué parte fue más útil?', display_order: 2, type: 'text', is_required: false, contributes_to_score: false },
      ],
    }]

    const mockClient = createMockClientWithDimensions(dimensions)
    const repo = new SupabaseDimensionRepository(mockClient as any)

    const result = await repo.findByInstrumentVersionId('ver-1')

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      const questions = result.value[0].questions
      expect(questions.length).toBe(2)

      // CRÍTICO: type debe ser 'text', NO 'likert' (default)
      expect(questions[0].type).toBe('text')
      expect(questions[1].type).toBe('text')

      // isRequired debe ser false para feedback
      expect(questions[0].isRequired).toBe(false)
      expect(questions[1].isRequired).toBe(false)

      // contributes_to_score debe ser false
      expect(questions[0].contributesToScore).toBe(false)
      expect(questions[1].contributesToScore).toBe(false)
    }
  })

  it('preguntas de tipo likert se mapean correctamente', async () => {
    const dimensions = [{
      id: 'd1',
      name: 'Estrategia',
      description: '',
      display_order: 1,
      color: '#000',
      instrument_version_id: 'ver-1',
      questions: [
        { id: 'q1', dimension_id: 'd1', text: 'La org tiene una visión clara', display_order: 1, type: 'likert', is_required: true, contributes_to_score: true },
      ],
    }]

    const mockClient = createMockClientWithDimensions(dimensions)
    const repo = new SupabaseDimensionRepository(mockClient as any)

    const result = await repo.findByInstrumentVersionId('ver-1')

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value[0].questions[0].type).toBe('likert')
      expect(result.value[0].questions[0].isRequired).toBe(true)
      expect(result.value[0].questions[0].contributesToScore).toBe(true)
    }
  })

  it('preguntas de tipo boolean se mapean correctamente', async () => {
    const dimensions = [{
      id: 'd1',
      name: 'Compliance',
      description: '',
      display_order: 1,
      color: '#000',
      instrument_version_id: 'ver-1',
      questions: [
        { id: 'q1', dimension_id: 'd1', text: '¿Tiene política de seguridad?', display_order: 1, type: 'boolean', is_required: true, contributes_to_score: false },
      ],
    }]

    const mockClient = createMockClientWithDimensions(dimensions)
    const repo = new SupabaseDimensionRepository(mockClient as any)

    const result = await repo.findByInstrumentVersionId('ver-1')

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value[0].questions[0].type).toBe('boolean')
      expect(result.value[0].questions[0].contributesToScore).toBe(false)
    }
  })

  it('preguntas sin type en BD default a likert', async () => {
    const dimensions = [{
      id: 'd1',
      name: 'Legacy',
      description: '',
      display_order: 1,
      color: '#000',
      instrument_version_id: null,
      questions: [
        // Pregunta legacy sin campo type (null/undefined)
        { id: 'q1', dimension_id: 'd1', text: 'Pregunta legacy', display_order: 1, type: null, is_required: null, contributes_to_score: null },
      ],
    }]

    const mockClient = createMockClientWithDimensions(dimensions)
    const repo = new SupabaseDimensionRepository(mockClient as any)

    const result = await repo.findWithQuestions()

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      // Default a 'likert' si type es null
      expect(result.value[0].questions[0].type).toBe('likert')
      // Default a required si is_required es null
      expect(result.value[0].questions[0].isRequired).toBe(true)
      // Default a contributes si contributes_to_score es null
      expect(result.value[0].questions[0].contributesToScore).toBe(true)
    }
  })

  it('dimensión mixta: likert + text se mapean con tipos correctos', async () => {
    const dimensions = [{
      id: 'd1',
      name: 'Mixta',
      description: '',
      display_order: 1,
      color: '#000',
      instrument_version_id: 'ver-1',
      questions: [
        { id: 'q1', dimension_id: 'd1', text: 'Califica tu experiencia', display_order: 1, type: 'likert', is_required: true, contributes_to_score: true },
        { id: 'q2', dimension_id: 'd1', text: '¿Comentarios adicionales?', display_order: 2, type: 'text', is_required: false, contributes_to_score: false },
      ],
    }]

    const mockClient = createMockClientWithDimensions(dimensions)
    const repo = new SupabaseDimensionRepository(mockClient as any)

    const result = await repo.findByInstrumentVersionId('ver-1')

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      const questions = result.value[0].questions
      // Primera pregunta: Likert (escala)
      expect(questions[0].type).toBe('likert')
      expect(questions[0].isRequired).toBe(true)
      // Segunda pregunta: Texto (abierta)
      expect(questions[1].type).toBe('text')
      expect(questions[1].isRequired).toBe(false)
    }
  })
})
