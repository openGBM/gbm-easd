import type { Result } from '../../errors'
import type { DomainError } from '../../errors'
import type { Dimension, DimensionWithQuestions } from '../../types/dtos'

export interface DimensionRepository {
  findAll(): Promise<Result<Dimension[], DomainError>>
  findWithQuestions(): Promise<Result<DimensionWithQuestions[], DomainError>>
  findByInstrumentVersionId(versionId: string): Promise<Result<DimensionWithQuestions[], DomainError>>
}
