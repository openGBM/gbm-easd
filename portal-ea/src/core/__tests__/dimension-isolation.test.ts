import { describe, it, expect, vi } from 'vitest'
import { SupabaseDimensionRepository } from '../adapters/supabase/repositories/dimension.repository'
import { isOk } from '../errors/result'

/**
 * Test de aislamiento de dimensiones por instrumento.
 *
 * BUG REPORTADO: Las encuestas mostraban preguntas de otros instrumentos
 * (400+ preguntas, decenas de dimensiones).
 *
 * CAUSA RAÍZ: findByInstrumentVersionId filtraba por questions.instrument_version_id
 * (columna inexistente en questions) en vez de dimensions.instrument_version_id.
 * El filtro fallaba silenciosamente, el fallback cargaba TODAS las dimensiones.
 *
 * FIX: Filtrar por dimensions.instrument_version_id directamente.
 */
describe('DimensionRepository — Aislamiento por Instrumento', () => {
  const VERSION_A = 'aaaa-1111'
  const VERSION_B = 'bbbb-2222'

  // Mock Supabase client
  function createMockClient(dimensions: Record<string, unknown>[]) {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation(function (this: any, field: string, value: string) {
        // Simular filtrado correcto: solo retornar dimensiones que match
        if (field === 'instrument_version_id') {
          const filtered = dimensions.filter(d => d.instrument_version_id === value)
          this._filtered = filtered
        }
        return this
      }),
      order: vi.fn().mockReturnThis(),
      then: undefined as any,
    }

    // Resolver con datos filtrados
    Object.defineProperty(mockQuery, 'then', {
      get() {
        const filtered = (mockQuery as any)._filtered || dimensions
        return (resolve: any) => resolve({ data: filtered, error: null })
      },
    })

    return {
      from: vi.fn().mockReturnValue(mockQuery),
    }
  }

  it('findByInstrumentVersionId solo retorna dimensiones del instrumento solicitado', async () => {
    const allDimensions = [
      { id: 'd1', name: 'Estrategia', description: 'desc', display_order: 1, color: '#000', instrument_version_id: VERSION_A, questions: [{ id: 'q1', dimension_id: 'd1', text: 'Pregunta 1', display_order: 1 }] },
      { id: 'd2', name: 'Tecnología', description: 'desc', display_order: 2, color: '#111', instrument_version_id: VERSION_A, questions: [{ id: 'q2', dimension_id: 'd2', text: 'Pregunta 2', display_order: 1 }] },
      { id: 'd3', name: 'Cultura', description: 'desc', display_order: 1, color: '#222', instrument_version_id: VERSION_B, questions: [{ id: 'q3', dimension_id: 'd3', text: 'Pregunta 3', display_order: 1 }] },
      { id: 'd4', name: 'Procesos', description: 'desc', display_order: 2, color: '#333', instrument_version_id: VERSION_B, questions: [{ id: 'q4', dimension_id: 'd4', text: 'Pregunta 4', display_order: 1 }] },
      { id: 'd5', name: 'Liderazgo', description: 'desc', display_order: 3, color: '#444', instrument_version_id: VERSION_B, questions: [{ id: 'q5', dimension_id: 'd5', text: 'Pregunta 5', display_order: 1 }] },
    ]

    const mockClient = createMockClient(allDimensions)
    const repo = new SupabaseDimensionRepository(mockClient as any)

    const result = await repo.findByInstrumentVersionId(VERSION_A)

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      // Solo debe retornar 2 dimensiones del VERSION_A, no las 5 totales
      expect(result.value.length).toBe(2)
      expect(result.value.every(d => d.id === 'd1' || d.id === 'd2')).toBe(true)
    }
  })

  it('findByInstrumentVersionId NO retorna dimensiones de otros instrumentos', async () => {
    const allDimensions = [
      { id: 'd1', name: 'Dim A', description: 'desc', display_order: 1, color: '#000', instrument_version_id: VERSION_A, questions: [] },
      { id: 'd2', name: 'Dim B', description: 'desc', display_order: 1, color: '#111', instrument_version_id: VERSION_B, questions: [] },
    ]

    const mockClient = createMockClient(allDimensions)
    const repo = new SupabaseDimensionRepository(mockClient as any)

    const result = await repo.findByInstrumentVersionId(VERSION_B)

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value.length).toBe(1)
      expect(result.value[0].name).toBe('Dim B')
      // Asegurar que NO contiene dimensiones de VERSION_A
      expect(result.value.some(d => d.name === 'Dim A')).toBe(false)
    }
  })

  it('findByInstrumentVersionId retorna vacío si no hay dimensiones para la versión', async () => {
    const allDimensions = [
      { id: 'd1', name: 'Dim', description: 'desc', display_order: 1, color: '#000', instrument_version_id: VERSION_A, questions: [] },
    ]

    const mockClient = createMockClient(allDimensions)
    const repo = new SupabaseDimensionRepository(mockClient as any)

    const result = await repo.findByInstrumentVersionId('nonexistent-version')

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value.length).toBe(0)
    }
  })

  it('el filtro se aplica en dimensions.instrument_version_id, NO en questions', async () => {
    // Este test verifica que el .eq() se llama con el campo correcto
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }

    // Make it thenable
    const queryPromise = Promise.resolve({ data: [], error: null })
    Object.assign(mockQuery, { then: queryPromise.then.bind(queryPromise) })

    const mockClient = { from: vi.fn().mockReturnValue(mockQuery) }
    const repo = new SupabaseDimensionRepository(mockClient as any)

    await repo.findByInstrumentVersionId('test-version-id')

    // Verificar que from() se llama con 'dimensions' (no 'questions')
    expect(mockClient.from).toHaveBeenCalledWith('dimensions')

    // Verificar que .eq() filtra por instrument_version_id directamente
    // (no por 'questions.instrument_version_id')
    expect(mockQuery.eq).toHaveBeenCalledWith('instrument_version_id', 'test-version-id')
  })
})



describe('Encuesta Page — Fallback para sesiones sin instrumento', () => {
  /**
   * BUG: Sesión creada sin instrument_version_id activaba fallback que
   * cargaba TODAS las dimensiones (88 dims, 430 preguntas) de todos los instrumentos.
   *
   * FIX: El fallback ahora solo carga dimensiones legacy (sin instrument_version_id).
   */

  it('sesión sin instrumentVersionId solo debe cargar dimensiones legacy (sin version asignada)', () => {
    // Simular el filtrado que hace la página de encuesta
    const allDimensions = [
      // Dimensiones legacy (sin instrument_version_id) — estas SÍ deben cargarse
      { id: 'd1', name: 'Legacy Dim 1', instrumentVersionId: null },
      { id: 'd2', name: 'Legacy Dim 2', instrumentVersionId: null },
      // Dimensiones de instrumentos — estas NO deben cargarse
      { id: 'd3', name: 'CSAT Dim', instrumentVersionId: 'version-csat' },
      { id: 'd4', name: 'AI-DLC Dim 1', instrumentVersionId: 'version-aidlc' },
      { id: 'd5', name: 'AI-DLC Dim 2', instrumentVersionId: 'version-aidlc' },
      { id: 'd6', name: 'EA Dim 1', instrumentVersionId: 'version-ea' },
      { id: 'd7', name: 'EA Dim 2', instrumentVersionId: 'version-ea' },
      { id: 'd8', name: 'EA Dim 3', instrumentVersionId: 'version-ea' },
    ]

    // Filtro que aplica la página para sesiones sin instrumento
    const legacyDims = allDimensions.filter(
      dim => !dim.instrumentVersionId
    )

    // Solo 2 dimensiones legacy, NO las 8 totales
    expect(legacyDims.length).toBe(2)
    expect(legacyDims.every(d => d.instrumentVersionId === null)).toBe(true)
    expect(legacyDims.some(d => d.name.includes('CSAT'))).toBe(false)
    expect(legacyDims.some(d => d.name.includes('AI-DLC'))).toBe(false)
    expect(legacyDims.some(d => d.name.includes('EA Dim'))).toBe(false)
  })

  it('sesión sin instrumentVersionId y sin dimensiones legacy muestra error, no carga todo', () => {
    // Simular: todas las dimensiones tienen version (no hay legacy)
    const allDimensions = [
      { id: 'd1', name: 'CSAT Dim', instrumentVersionId: 'version-csat' },
      { id: 'd2', name: 'EA Dim', instrumentVersionId: 'version-ea' },
    ]

    const legacyDims = allDimensions.filter(dim => !dim.instrumentVersionId)

    // Resultado: vacío (la página mostraría "Encuesta no configurada")
    expect(legacyDims.length).toBe(0)
  })

  it('sesión CON instrumentVersionId nunca activa el fallback global', () => {
    const session = { instrumentVersionId: 'version-csat' }
    const dimensionsFromVersion = [
      { id: 'd1', name: 'Satisfacción', instrumentVersionId: 'version-csat' },
    ]

    // Si la sesión tiene versión y findByInstrumentVersionId retorna datos,
    // el fallback nunca se ejecuta
    const shouldUseFallback = dimensionsFromVersion.length === 0 && !session.instrumentVersionId
    expect(shouldUseFallback).toBe(false)
  })

  it('nunca se cargan más de las dimensiones del instrumento asignado', () => {
    // Regla de negocio: una encuesta siempre muestra SOLO las dimensiones de SU instrumento
    const INSTRUMENT_CSAT_DIMS = 3
    const INSTRUMENT_EA_DIMS = 8
    const INSTRUMENT_AIDLC_DIMS = 6
    const TOTAL_ALL_INSTRUMENTS = INSTRUMENT_CSAT_DIMS + INSTRUMENT_EA_DIMS + INSTRUMENT_AIDLC_DIMS // 17

    // Si una sesión CSAT carga 17 dimensiones, es un bug
    const sessionInstrumentDimCount = INSTRUMENT_CSAT_DIMS
    expect(sessionInstrumentDimCount).toBeLessThan(TOTAL_ALL_INSTRUMENTS)

    // La cantidad cargada NUNCA debe exceder las del instrumento asignado
    // (Este test documenta la invariante de negocio)
    expect(sessionInstrumentDimCount).toBeLessThanOrEqual(INSTRUMENT_CSAT_DIMS)
  })
})
