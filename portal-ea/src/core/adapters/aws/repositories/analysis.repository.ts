// TODO: Replace with actual AWS SDK implementation
import type { AnalysisRepository } from '../../../ports/repositories/analysis.repository'
import type { Analysis, CreateAnalysisDTO } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import type { DomainError } from '../../../errors/domain-errors'
import { err } from '../../../errors/result'
import { ServiceUnavailableError } from '../../../errors/domain-errors'

export class AwsAnalysisRepository implements AnalysisRepository {
  findBySessionId(_sessionId: string): Promise<Result<Analysis[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  create(_data: CreateAnalysisDTO): Promise<Result<Analysis, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  findLatest(_sessionId: string): Promise<Result<Analysis | null, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }
}
