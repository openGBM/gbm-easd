import type { SupabaseClient } from '@supabase/supabase-js'
import type { UsageLogRepository } from '../../../ports/repositories/usage-log.repository'
import type { CreateUsageLogDTO } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import { ok, err } from '../../../errors/result'
import { InternalError, type DomainError } from '../../../errors/domain-errors'

export class SupabaseUsageLogRepository implements UsageLogRepository {
  constructor(private readonly client: SupabaseClient) {}

  async log(data: CreateUsageLogDTO): Promise<Result<void, DomainError>> {
    const { error } = await this.client
      .from('usage_logs')
      .insert({
        tenant_id: data.tenantId,
        action: data.action,
        metadata: data.metadata ?? null,
      })

    if (error) {
      return err(new InternalError('Error al registrar uso', { table: 'usage_logs' }))
    }

    return ok(undefined)
  }

  async countByPeriod(tenantId: string, action: string, since: Date): Promise<Result<number, never>> {
    const { count, error } = await this.client
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('action', action)
      .gte('created_at', since.toISOString())

    if (error) {
      return ok(0)
    }

    return ok(count || 0)
  }
}
