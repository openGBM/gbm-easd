// TODO: Replace with actual AWS SDK implementation
import type { DimensionRepository } from '../../../ports/repositories/dimension.repository'
import type { Dimension, DimensionWithQuestions } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import type { DomainError } from '../../../errors/domain-errors'
import { err } from '../../../errors/result'
import { ServiceUnavailableError } from '../../../errors/domain-errors'

export class AwsDimensionRepository implements DimensionRepository {
  findAll(): Promise<Result<Dimension[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  findWithQuestions(): Promise<Result<DimensionWithQuestions[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  findByInstrumentVersionId(_versionId: string): Promise<Result<DimensionWithQuestions[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }
}
