import { describe, it, expect, vi } from 'vitest'
import { SupabaseAnalysisRepository } from '../adapters/supabase/repositories/analysis.repository'
import { SupabaseRespondentRepository } from '../adapters/supabase/repositories/respondent.repository'
import { isOk } from '../errors/result'

/**
 * Tests para análisis IA y tiempo promedio de respuesta.
 *
 * BUGS CORREGIDOS:
 * 1. findLatest usaba order('created_at') pero la tabla tiene 'generated_at'
 * 2. mapToAnalysis leía row.content pero la columna es 'analysis_text'
 */
describe('AnalysisRepository — lectura correcta del análisis guardado', () => {
  it('findLatest ordena por generated_at (no created_at)', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    }

    const analysisRow = {
      id: 'anal-1',
      session_id: 'ses-1',
      analysis_text: '## Resumen\n\nEl análisis muestra fortalezas en...',
      generated_at: '2026-07-04T10:00:00Z',
      generated_by: 'admin@gbm.net',
      total_respondents: 5,
      model: null,
    }

    const queryPromise = Promise.resolve({ data: analysisRow, error: null })
    Object.assign(mockQuery, { then: queryPromise.then.bind(queryPromise) })

    const mockClient = { from: vi.fn().mockReturnValue(mockQuery) }
    const repo = new SupabaseAnalysisRepository(mockClient as any)

    const result = await repo.findLatest('ses-1')

    // Verificar que order se llama con 'generated_at' (no 'created_at')
    expect(mockQuery.order).toHaveBeenCalledWith('generated_at', { ascending: false })

    expect(isOk(result)).toBe(true)
    if (isOk(result) && result.value) {
      expect(result.value.content).toBe('## Resumen\n\nEl análisis muestra fortalezas en...')
      expect(result.value.sessionId).toBe('ses-1')
    }
  })

  it('mapToAnalysis lee analysis_text (no content)', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    }

    const analysisRow = {
      id: 'anal-1',
      session_id: 'ses-1',
      analysis_text: 'Texto del análisis generado por IA',
      generated_at: '2026-07-04T10:00:00Z',
      generated_by: 'admin@gbm.net',
      // NO tiene campo 'content' — la tabla usa 'analysis_text'
    }

    const queryPromise = Promise.resolve({ data: analysisRow, error: null })
    Object.assign(mockQuery, { then: queryPromise.then.bind(queryPromise) })

    const mockClient = { from: vi.fn().mockReturnValue(mockQuery) }
    const repo = new SupabaseAnalysisRepository(mockClient as any)

    const result = await repo.findLatest('ses-1')

    expect(isOk(result)).toBe(true)
    if (isOk(result) && result.value) {
      // content debe tener el valor de analysis_text
      expect(result.value.content).toBe('Texto del análisis generado por IA')
      // createdAt debe tener el valor de generated_at
      expect(result.value.createdAt).toBe('2026-07-04T10:00:00Z')
    }
  })

  it('findLatest retorna null si no hay análisis (no error)', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    }

    // Supabase retorna error cuando .single() no encuentra filas
    const queryPromise = Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'No rows' } })
    Object.assign(mockQuery, { then: queryPromise.then.bind(queryPromise) })

    const mockClient = { from: vi.fn().mockReturnValue(mockQuery) }
    const repo = new SupabaseAnalysisRepository(mockClient as any)

    const result = await repo.findLatest('ses-nonexistent')

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value).toBeNull()
    }
  })
})

describe('RespondentRepository — tiempo promedio de respuesta', () => {
  it('findCompletedWithTiming retorna createdAt y completedAt', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
    }

    const respondents = [
      { created_at: '2026-07-04T10:00:00Z', completed_at: '2026-07-04T10:15:00Z' }, // 15 min
      { created_at: '2026-07-04T11:00:00Z', completed_at: '2026-07-04T11:05:00Z' }, // 5 min
    ]

    const queryPromise = Promise.resolve({ data: respondents, error: null })
    Object.assign(mockQuery, { then: queryPromise.then.bind(queryPromise) })

    const mockClient = { from: vi.fn().mockReturnValue(mockQuery) }
    const repo = new SupabaseRespondentRepository(mockClient as any)

    const result = await repo.findCompletedWithTiming()

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value.length).toBe(2)
      expect(result.value[0].createdAt).toBe('2026-07-04T10:00:00Z')
      expect(result.value[0].completedAt).toBe('2026-07-04T10:15:00Z')

      // Verificar que se puede calcular el promedio
      const totalMinutes = result.value.reduce((sum, r) => {
        const start = new Date(r.createdAt).getTime()
        const end = new Date(r.completedAt).getTime()
        return sum + (end - start) / 1000 / 60
      }, 0)
      const avg = Math.round(totalMinutes / result.value.length)
      expect(avg).toBe(10) // (15 + 5) / 2 = 10 min
    }
  })

  it('findCompletedWithTiming retorna vacío si no hay respondents completados con timing', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
    }

    const queryPromise = Promise.resolve({ data: [], error: null })
    Object.assign(mockQuery, { then: queryPromise.then.bind(queryPromise) })

    const mockClient = { from: vi.fn().mockReturnValue(mockQuery) }
    const repo = new SupabaseRespondentRepository(mockClient as any)

    const result = await repo.findCompletedWithTiming()

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value.length).toBe(0)
    }
  })

  it('markCompleted establece completed_at con timestamp actual', async () => {
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }

    const queryPromise = Promise.resolve({ error: null })
    Object.assign(mockQuery, { then: queryPromise.then.bind(queryPromise) })

    const mockClient = { from: vi.fn().mockReturnValue(mockQuery) }
    const repo = new SupabaseRespondentRepository(mockClient as any)

    const before = Date.now()
    await repo.markCompleted('resp-1')

    // Verificar que update fue llamado con completed: true Y completed_at
    expect(mockQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        completed: true,
        completed_at: expect.any(String),
      })
    )

    // Verificar que el timestamp es reciente (dentro de 5 segundos)
    const updateArg = mockQuery.update.mock.calls[0][0]
    const completedAt = new Date(updateArg.completed_at).getTime()
    expect(completedAt).toBeGreaterThanOrEqual(before)
    expect(completedAt).toBeLessThanOrEqual(Date.now() + 1000)
  })
})
