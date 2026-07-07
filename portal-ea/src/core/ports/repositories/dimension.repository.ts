import type { Result } from '../../errors'
import type { DomainError } from '../../errors'
import type { Dimension, DimensionWithQuestions, CreateDimensionDTO } from '../../types/dtos'

export interface DimensionRepository {
  findAll(): Promise<Result<Dimension[], DomainError>>
  findWithQuestions(): Promise<Result<DimensionWithQuestions[], DomainError>>
  findByInstrumentVersionId(versionId: string): Promise<Result<DimensionWithQuestions[], DomainError>>
  create(data: CreateDimensionDTO): Promise<Result<Dimension, DomainError>>
}
