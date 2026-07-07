// TODO: Replace with actual AWS SDK implementation
import type { UsageLogRepository } from '../../../ports/repositories/usage-log.repository'
import type { CreateUsageLogDTO } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import type { DomainError } from '../../../errors/domain-errors'
import { err } from '../../../errors/result'
import { ServiceUnavailableError } from '../../../errors/domain-errors'

export class AwsUsageLogRepository implements UsageLogRepository {
  log(_data: CreateUsageLogDTO): Promise<Result<void, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  countByPeriod(_tenantId: string, _action: string, _since: Date): Promise<Result<number, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }
}
