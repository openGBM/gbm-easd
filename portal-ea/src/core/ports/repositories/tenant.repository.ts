import type { Result } from '../../errors'
import type { DomainError, NotFoundError } from '../../errors'
import type { Tenant, CreateTenantDTO, UpdateTenantDTO, LimitCheck } from '../../types/dtos'

export interface TenantRepository {
  findById(id: string): Promise<Result<Tenant, NotFoundError>>
  findAll(): Promise<Result<Tenant[], DomainError>>
  create(data: CreateTenantDTO): Promise<Result<Tenant, DomainError>>
  update(id: string, data: UpdateTenantDTO): Promise<Result<Tenant, DomainError>>
  checkSessionLimit(tenantId: string): Promise<Result<LimitCheck, DomainError>>
  checkAnalysisLimit(tenantId: string): Promise<Result<LimitCheck, DomainError>>
}
