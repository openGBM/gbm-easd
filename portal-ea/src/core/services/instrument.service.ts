import type { InstrumentRepository } from '../ports/repositories/instrument.repository'
import type { DimensionRepository } from '../ports/repositories/dimension.repository'
import type { QuestionRepository } from '../ports/repositories/question.repository'
import type { InstrumentWithVersion } from '../types/dtos'
import type { DomainError } from '../errors/domain-errors'
import type { Result } from '../errors/result'
import { ok, err, isOk } from '../errors/result'
import { NotFoundError, InternalError } from '../errors/domain-errors'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreateInstrumentInput {
  name: string
  description?: string
}

export interface InstrumentWithStats extends InstrumentWithVersion {
  sessionCount: number
}

// ─── Service ────────────────────────────────────────────────────────────────

export class InstrumentService {
  constructor(
    private readonly instrumentRepo: InstrumentRepository,
    private readonly dimensionRepo: DimensionRepository,
    private readonly questionRepo: QuestionRepository,
  ) {}

  /**
   * Crear instrumento + versión inicial automática.
   */
  async createInstrument(data: CreateInstrumentInput): Promise<Result<InstrumentWithVersion, DomainError>> {
    // Crear el instrumento
    const instrumentResult = await this.instrumentRepo.create({
      name: data.name,
      description: data.description,
    })

    if (!isOk(instrumentResult)) return instrumentResult

    // Crear versión 1 activa
    const versionResult = await this.instrumentRepo.createVersion({
      instrumentId: instrumentResult.value.id,
      versionNumber: 1,
      isActive: true,
    })

    if (!isOk(versionResult)) {
      // Instrumento creado pero versión falló — retornar instrumento sin versión
      return instrumentResult
    }

    return ok({
      ...instrumentResult.value,
      activeVersion: versionResult.value,
    })
  }

  /**
   * Listar instrumentos (delegación simple por ahora).
   * La lógica de contar sesiones por versión requiere queries adicionales
   * que se implementarán cuando se extienda el InstrumentRepository.
   */
  async listInstruments(): Promise<Result<InstrumentWithVersion[], DomainError>> {
    return this.instrumentRepo.findAll()
  }

  /**
   * Toggle activo/inactivo de un instrumento.
   * Nota: Requiere extender InstrumentRepository con método update().
   * Por ahora es placeholder.
   */
  async toggleActive(id: string): Promise<Result<void, DomainError>> {
    const instrumentResult = await this.instrumentRepo.findById(id)
    if (!isOk(instrumentResult)) return instrumentResult

    // TODO: Requiere InstrumentRepository.update() — se implementa en extensión de interfaces
    return ok(undefined)
  }

  /**
   * Duplicar instrumento completo (instrumento + versión + dimensiones + preguntas).
   * Esta es la operación multi-paso más compleja del sistema.
   *
   * Nota: La implementación completa requiere extender repos con:
   * - DimensionRepository.create()
   * - QuestionRepository.createBatch()
   * - InstrumentVersionRepository con scale_labels, maturity_levels
   *
   * Por ahora implementa la estructura del flujo.
   */
  async duplicateInstrument(sourceId: string, newName: string): Promise<Result<InstrumentWithVersion, DomainError>> {
    // 1. Obtener instrumento fuente
    const sourceResult = await this.instrumentRepo.findById(sourceId)
    if (!isOk(sourceResult)) return sourceResult

    // 2. Crear nuevo instrumento
    const newInstrument = await this.instrumentRepo.create({
      name: newName,
      description: sourceResult.value.description ?? undefined,
    })

    if (!isOk(newInstrument)) return newInstrument

    // 3. Crear versión 1 para el nuevo instrumento
    const newVersion = await this.instrumentRepo.createVersion({
      instrumentId: newInstrument.value.id,
      versionNumber: 1,
      isActive: true,
    })

    if (!isOk(newVersion)) return newInstrument // Retornar sin versión

    // 4. Copiar dimensiones y preguntas
    // TODO: Requiere DimensionRepository.create() y QuestionRepository.createBatch()
    // Se implementará cuando los repos se extiendan en una iteración posterior.
    // Por ahora, el instrumento duplicado se crea vacío (sin dimensiones).

    return ok({
      ...newInstrument.value,
      activeVersion: newVersion.value,
    })
  }
}
