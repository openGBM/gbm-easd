import type { Result } from '../../errors'
import type { DomainError } from '../../errors'
import type { Analysis, CreateAnalysisDTO } from '../../types/dtos'

export interface AnalysisRepository {
  findBySessionId(sessionId: string): Promise<Result<Analysis[], DomainError>>
  create(data: CreateAnalysisDTO): Promise<Result<Analysis, DomainError>>
  findLatest(sessionId: string): Promise<Result<Analysis | null, DomainError>>
}
