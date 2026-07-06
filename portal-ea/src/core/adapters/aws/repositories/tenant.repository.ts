// TODO: Replace with actual AWS SDK implementation
import type { TenantRepository } from '../../../ports/repositories/tenant.repository'
import type { Tenant, CreateTenantDTO, UpdateTenantDTO, LimitCheck } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import type { DomainError, NotFoundError } from '../../../errors/domain-errors'
import { err } from '../../../errors/result'
import { ServiceUnavailableError, NotFoundError as NotFoundErrorClass } from '../../../errors/domain-errors'

export class AwsTenantRepository implements TenantRepository {
  findById(_id: string): Promise<Result<Tenant, NotFoundError>> {
    return Promise.resolve(err(new NotFoundErrorClass('AWS adapter no implementado')))
  }

  findAll(): Promise<Result<Tenant[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  create(_data: CreateTenantDTO): Promise<Result<Tenant, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  update(_id: string, _data: UpdateTenantDTO): Promise<Result<Tenant, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  checkSessionLimit(_tenantId: string): Promise<Result<LimitCheck, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  checkAnalysisLimit(_tenantId: string): Promise<Result<LimitCheck, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }
}
