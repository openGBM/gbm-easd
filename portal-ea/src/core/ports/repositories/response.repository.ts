import type { Result } from '../../errors'
import type { DomainError } from '../../errors'
import type { ResponseWithQuestion, CreateResponseDTO, DimensionScore } from '../../types/dtos'

export interface ResponseRepository {
  findByRespondentId(respondentId: string): Promise<Result<ResponseWithQuestion[], DomainError>>
  findBySessionId(sessionId: string): Promise<Result<ResponseWithQuestion[], DomainError>>
  upsertBatch(respondentId: string, responses: CreateResponseDTO[]): Promise<Result<void, DomainError>>
  getAggregatedBySession(sessionId: string): Promise<Result<DimensionScore[], DomainError>>
  getAggregatedByRespondent(respondentId: string): Promise<Result<DimensionScore[], DomainError>>
}
