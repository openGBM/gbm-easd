import type { Result } from '../../errors'
import type { DomainError, NotFoundError } from '../../errors'
import type { Respondent, CreateRespondentDTO } from '../../types/dtos'

export interface RespondentRepository {
  findById(id: string): Promise<Result<Respondent, NotFoundError>>
  findBySessionId(sessionId: string): Promise<Result<Respondent[], DomainError>>
  findByEmail(sessionId: string, email: string): Promise<Result<Respondent | null, DomainError>>
  create(data: CreateRespondentDTO): Promise<Result<Respondent, DomainError>>
  markCompleted(id: string): Promise<Result<void, DomainError>>
  delete(id: string): Promise<Result<void, DomainError>>
  countBySession(sessionId: string): Promise<Result<number, DomainError>>
}
