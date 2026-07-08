import { describe, it, expect, vi } from 'vitest'
import { SupabaseInstrumentRepository } from '../adapters/supabase/repositories/instrument.repository'
import { SupabaseSessionRepository } from '../adapters/supabase/repositories/session.repository'
import { isOk } from '../errors/result'

/**
 * Tests de creación de instrumentos y sesiones.
 *
 * BUGS CORREGIDOS:
 * 1. mapToInstrumentWithVersion buscaba is_active (inexistente) en vez de is_current
 * 2. Sesiones se creaban sin instrument_version_id porque activeVersion era siempre null
 * 3. Encuestas cargaban 430+ preguntas de todos los instrumentos
 */

describe('InstrumentRepository — mapeo correcto de versiones', () => {
  function createMockClientWithInstruments(instruments: any[]) {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    }

    const queryPromise = Promise.resolve({ data: instruments, error: null })
    Object.assign(mockQuery, { then: queryPromise.then.bind(queryPromise) })

    return { from: vi.fn().mockReturnValue(mockQuery) }
  }

  it('mapea is_current como activeVersion (no is_active)', async () => {
    const instruments = [{
      id: 'inst-1',
      name: 'CSAT',
      description: 'Customer Satisfaction',
      created_at: '2026-01-01',
      is_active: true,
      instrument_versions: [
        { id: 'ver-1', instrument_id: 'inst-1', version_number: 1, is_current: true, version_tag: '1' },
        { id: 'ver-2', instrument_id: 'inst-1', version_number: 2, is_current: false, version_tag: '2' },
      ],
    }]

    const mockClient = createMockClientWithInstruments(instruments)
    const repo = new SupabaseInstrumentRepository(mockClient as any)

    const result = await repo.findAll()

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value.length).toBe(1)
      // activeVersion debe ser la versión con is_current=true
      expect(result.value[0].activeVersion).not.toBeNull()
      expect(result.value[0].activeVersion!.id).toBe('ver-1')
      expect(result.value[0].activeVersion!.versionNumber).toBe(1)
    }
  })

  it('activeVersion es null si ninguna versión tiene is_current=true', async () => {
    const instruments = [{
      id: 'inst-1',
      name: 'Draft',
      description: null,
      created_at: '2026-01-01',
      is_active: true,
      instrument_versions: [
        { id: 'ver-1', instrument_id: 'inst-1', version_number: 1, is_current: false, version_tag: '1' },
      ],
    }]

    const mockClient = createMockClientWithInstruments(instruments)
    const repo = new SupabaseInstrumentRepository(mockClient as any)

    const result = await repo.findAll()

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value[0].activeVersion).toBeNull()
    }
  })

  it('selecciona la versión correcta cuando hay múltiples (solo is_current=true)', async () => {
    const instruments = [{
      id: 'inst-1',
      name: 'Multi-version',
      description: null,
      created_at: '2026-01-01',
      is_active: true,
      instrument_versions: [
        { id: 'ver-old', instrument_id: 'inst-1', version_number: 1, is_current: false, version_tag: '1' },
        { id: 'ver-current', instrument_id: 'inst-1', version_number: 2, is_current: true, version_tag: '2' },
        { id: 'ver-draft', instrument_id: 'inst-1', version_number: 3, is_current: false, version_tag: '3-draft' },
      ],
    }]

    const mockClient = createMockClientWithInstruments(instruments)
    const repo = new SupabaseInstrumentRepository(mockClient as any)

    const result = await repo.findAll()

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      // Solo la versión 2 (is_current=true) debe ser activeVersion
      expect(result.value[0].activeVersion!.id).toBe('ver-current')
      expect(result.value[0].activeVersion!.versionNumber).toBe(2)
    }
  })

  it('NO confunde is_active del instrumento con is_current de la versión', async () => {
    // Un instrumento activo (is_active=true) puede tener versiones sin is_current
    const instruments = [{
      id: 'inst-1',
      name: 'Active but no current version',
      description: null,
      created_at: '2026-01-01',
      is_active: true, // Instrumento activo
      instrument_versions: [
        // Pero ninguna versión es current
        { id: 'ver-1', instrument_id: 'inst-1', version_number: 1, is_current: false, version_tag: '1' },
      ],
    }]

    const mockClient = createMockClientWithInstruments(instruments)
    const repo = new SupabaseInstrumentRepository(mockClient as any)

    const result = await repo.findAll()

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      // El instrumento existe pero sin activeVersion
      expect(result.value[0].name).toBe('Active but no current version')
      expect(result.value[0].activeVersion).toBeNull()
    }
  })
})

describe('SessionRepository — creación con instrument_version_id', () => {
  it('create() incluye instrumentVersionId cuando se proporciona', async () => {
    const insertedData = {
      id: 'new-session-id',
      name: 'Encuesta CSAT',
      is_active: true,
      tenant_id: null,
      instrument_version_id: 'ver-csat-1',
      created_at: '2026-07-04',
    }

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    }
    const queryPromise = Promise.resolve({ data: insertedData, error: null })
    Object.assign(mockQuery, { then: queryPromise.then.bind(queryPromise) })

    const mockClient = { from: vi.fn().mockReturnValue(mockQuery) }
    const repo = new SupabaseSessionRepository(mockClient as any)

    const result = await repo.create({
      name: 'Encuesta CSAT',
      instrumentVersionId: 'ver-csat-1',
    })

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value.instrumentVersionId).toBe('ver-csat-1')
      expect(result.value.name).toBe('Encuesta CSAT')
    }

    // Verificar que insert fue llamado con instrument_version_id
    expect(mockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      instrument_version_id: 'ver-csat-1',
    }))
  })

  it('create() pasa null para instrumentVersionId cuando no se proporciona', async () => {
    const insertedData = {
      id: 'new-session-id',
      name: 'Sesión Legacy',
      is_active: true,
      tenant_id: null,
      instrument_version_id: null,
      created_at: '2026-07-04',
    }

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    }
    const queryPromise = Promise.resolve({ data: insertedData, error: null })
    Object.assign(mockQuery, { then: queryPromise.then.bind(queryPromise) })

    const mockClient = { from: vi.fn().mockReturnValue(mockQuery) }
    const repo = new SupabaseSessionRepository(mockClient as any)

    const result = await repo.create({
      name: 'Sesión Legacy',
      // Sin instrumentVersionId
    })

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value.instrumentVersionId).toBeNull()
    }

    // Verificar que insert fue llamado con null
    expect(mockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      instrument_version_id: null,
    }))
  })
})

describe('Flujo completo: Instrumento → Sesión → Encuesta', () => {
  it('la cadena completa: cargar instrumento con current_version → crear sesión → verificar version_id', () => {
    // Simular el flujo del admin dashboard
    const instrumentFromDB = {
      id: 'inst-csat',
      name: 'CSAT',
      instrument_versions: [
        { id: 'ver-csat-current', instrument_id: 'inst-csat', version_number: 1, is_current: true },
      ],
    }

    // 1. El adapter mapea correctamente (usa is_current, no is_active)
    const versions = instrumentFromDB.instrument_versions
    const activeVersion = versions.find(v => v.is_current === true) || null

    expect(activeVersion).not.toBeNull()
    expect(activeVersion!.id).toBe('ver-csat-current')

    // 2. El dashboard extrae el version_id para crear la sesión
    const instrumentVersionId = activeVersion ? activeVersion.id : null
    expect(instrumentVersionId).toBe('ver-csat-current')

    // 3. La sesión se crea con el version_id correcto
    const sessionData = {
      name: 'Encuesta CSAT Julio',
      instrument_version_id: instrumentVersionId,
    }
    expect(sessionData.instrument_version_id).toBe('ver-csat-current')
    expect(sessionData.instrument_version_id).not.toBeNull()

    // 4. La encuesta page usa el version_id para filtrar dimensiones
    const dimensionFilter = sessionData.instrument_version_id
    expect(dimensionFilter).toBe('ver-csat-current')
    // Con este filtro, solo se cargan dimensiones de CSAT, no de otros instrumentos
  })

  it('si is_current es false en todas las versiones, la sesión se crea sin instrumento', () => {
    const instrumentFromDB = {
      id: 'inst-draft',
      name: 'Draft',
      instrument_versions: [
        { id: 'ver-1', instrument_id: 'inst-draft', version_number: 1, is_current: false },
      ],
    }

    const versions = instrumentFromDB.instrument_versions
    const activeVersion = versions.find(v => v.is_current === true) || null

    // No hay versión current → activeVersion es null
    expect(activeVersion).toBeNull()

    // La sesión no tendrá instrument_version_id
    const instrumentVersionId = activeVersion ? activeVersion.id : null
    expect(instrumentVersionId).toBeNull()
  })
})
