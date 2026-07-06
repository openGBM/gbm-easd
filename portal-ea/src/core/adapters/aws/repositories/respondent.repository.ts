// TODO: Replace with actual AWS SDK implementation
import type { RespondentRepository } from '../../../ports/repositories/respondent.repository'
import type { Respondent, CreateRespondentDTO } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import type { DomainError, NotFoundError } from '../../../errors/domain-errors'
import { err } from '../../../errors/result'
import { ServiceUnavailableError, NotFoundError as NotFoundErrorClass } from '../../../errors/domain-errors'

export class AwsRespondentRepository implements RespondentRepository {
  findById(_id: string): Promise<Result<Respondent, NotFoundError>> {
    return Promise.resolve(err(new NotFoundErrorClass('AWS adapter no implementado')))
  }

  findBySessionId(_sessionId: string): Promise<Result<Respondent[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  findByEmail(_sessionId: string, _email: string): Promise<Result<Respondent | null, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  create(_data: CreateRespondentDTO): Promise<Result<Respondent, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  markCompleted(_id: string): Promise<Result<void, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  delete(_id: string): Promise<Result<void, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  countBySession(_sessionId: string): Promise<Result<number, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  countCompleted(_tenantId?: string): Promise<Result<number, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  findCompletedWithTiming(_tenantId?: string): Promise<Result<{ createdAt: string; completedAt: string }[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  deleteBySessionId(_sessionId: string): Promise<Result<void, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }
}
