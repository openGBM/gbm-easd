import type { Result } from '../../errors'
import type { DomainError } from '../../errors'
import type { CreateUsageLogDTO } from '../../types/dtos'

export interface UsageLogRepository {
  log(data: CreateUsageLogDTO): Promise<Result<void, DomainError>>
  countByPeriod(tenantId: string, action: string, since: Date): Promise<Result<number, DomainError>>
}
