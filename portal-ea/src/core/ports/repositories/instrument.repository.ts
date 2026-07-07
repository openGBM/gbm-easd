import type { Result } from '../../errors'
import type { DomainError, NotFoundError } from '../../errors'
import type { InstrumentWithVersion, InstrumentVersion, CreateInstrumentDTO, CreateVersionDTO, InstrumentVersionWithDetails, InstrumentWithAllVersions } from '../../types/dtos'

export interface InstrumentRepository {
  findAll(): Promise<Result<InstrumentWithVersion[], DomainError>>
  findById(id: string): Promise<Result<InstrumentWithVersion, NotFoundError>>
  findActiveVersion(instrumentId: string): Promise<Result<InstrumentVersion, NotFoundError>>
  create(data: CreateInstrumentDTO): Promise<Result<InstrumentWithVersion, DomainError>>
  createVersion(data: CreateVersionDTO): Promise<Result<InstrumentVersion, DomainError>>
  findVersionWithInstrument(versionId: string): Promise<Result<InstrumentVersionWithDetails, NotFoundError>>
  findActiveForSessionCreation(): Promise<Result<InstrumentWithVersion[], DomainError>>
  findAllWithVersions(): Promise<Result<InstrumentWithAllVersions[], DomainError>>
  findVersionDetails(versionId: string): Promise<Result<{ scaleLabels: unknown; maturityLevels: unknown }, NotFoundError>>
  countActive(): Promise<Result<number, DomainError>>
}
