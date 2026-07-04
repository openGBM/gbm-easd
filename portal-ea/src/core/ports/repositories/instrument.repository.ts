import type { Result } from '../../errors'
import type { DomainError, NotFoundError } from '../../errors'
import type { InstrumentWithVersion, InstrumentVersion, CreateInstrumentDTO, CreateVersionDTO } from '../../types/dtos'

export interface InstrumentRepository {
  findAll(): Promise<Result<InstrumentWithVersion[], DomainError>>
  findById(id: string): Promise<Result<InstrumentWithVersion, NotFoundError>>
  findActiveVersion(instrumentId: string): Promise<Result<InstrumentVersion, NotFoundError>>
  create(data: CreateInstrumentDTO): Promise<Result<InstrumentWithVersion, DomainError>>
  createVersion(data: CreateVersionDTO): Promise<Result<InstrumentVersion, DomainError>>
}
