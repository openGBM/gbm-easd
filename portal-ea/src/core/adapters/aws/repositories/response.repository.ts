// TODO: Replace with actual AWS SDK implementation
import type { ResponseRepository } from '../../../ports/repositories/response.repository'
import type { ResponseWithQuestion, CreateResponseDTO, DimensionScore, RawResponse } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import type { DomainError } from '../../../errors/domain-errors'
import { err } from '../../../errors/result'
import { ServiceUnavailableError } from '../../../errors/domain-errors'

export class AwsResponseRepository implements ResponseRepository {
  findByRespondentId(_respondentId: string): Promise<Result<ResponseWithQuestion[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  findBySessionId(_sessionId: string): Promise<Result<ResponseWithQuestion[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  upsertBatch(_respondentId: string, _responses: CreateResponseDTO[]): Promise<Result<void, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  getAggregatedBySession(_sessionId: string): Promise<Result<DimensionScore[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  getAggregatedByRespondent(_respondentId: string): Promise<Result<DimensionScore[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  findRawByRespondentId(_respondentId: string): Promise<Result<RawResponse[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  findByRespondentIds(_respondentIds: string[]): Promise<Result<ResponseWithQuestion[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  deleteByRespondentId(_respondentId: string): Promise<Result<void, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  deleteByRespondentIds(_respondentIds: string[]): Promise<Result<void, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }
}
