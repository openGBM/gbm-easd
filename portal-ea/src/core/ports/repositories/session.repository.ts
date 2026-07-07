import type { Result } from '../../errors'
import type { DomainError, NotFoundError } from '../../errors'
import type { Session, CreateSessionDTO, UpdateSessionDTO, SessionFilters, SessionWithRespondentCount, SessionWithInstrumentDetails } from '../../types/dtos'

export interface SessionRepository {
  findById(id: string): Promise<Result<Session, NotFoundError>>
  findAll(filters?: SessionFilters): Promise<Result<Session[], DomainError>>
  findByTenantId(tenantId: string, filters?: SessionFilters): Promise<Result<Session[], DomainError>>
  create(data: CreateSessionDTO): Promise<Result<Session, DomainError>>
  update(id: string, data: UpdateSessionDTO): Promise<Result<Session, DomainError>>
  delete(id: string): Promise<Result<void, DomainError>>
  toggleActive(id: string): Promise<Result<Session, DomainError>>
  countActive(tenantId?: string): Promise<Result<number, DomainError>>
  findAllWithRespondentCount(filters?: SessionFilters): Promise<Result<SessionWithRespondentCount[], DomainError>>
  findByIdWithInstrument(id: string): Promise<Result<SessionWithInstrumentDetails, NotFoundError>>
  countByVersionIds(versionIds: string[]): Promise<Result<Record<string, number>, DomainError>>
}
