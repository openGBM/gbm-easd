// TODO: Replace with actual AWS SDK implementation
import type { SessionRepository } from '../../../ports/repositories/session.repository'
import type { Session, CreateSessionDTO, UpdateSessionDTO, SessionFilters } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import type { DomainError, NotFoundError } from '../../../errors/domain-errors'
import { err } from '../../../errors/result'
import { ServiceUnavailableError, NotFoundError as NotFoundErrorClass } from '../../../errors/domain-errors'

export class AwsSessionRepository implements SessionRepository {
  findById(_id: string): Promise<Result<Session, NotFoundError>> {
    return Promise.resolve(err(new NotFoundErrorClass('AWS adapter no implementado')))
  }

  findAll(_filters?: SessionFilters): Promise<Result<Session[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  findByTenantId(_tenantId: string, _filters?: SessionFilters): Promise<Result<Session[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  create(_data: CreateSessionDTO): Promise<Result<Session, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  update(_id: string, _data: UpdateSessionDTO): Promise<Result<Session, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  delete(_id: string): Promise<Result<void, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  toggleActive(_id: string): Promise<Result<Session, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  countActive(_tenantId?: string): Promise<Result<number, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }
}
