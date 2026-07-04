import type { SupabaseClient } from '@supabase/supabase-js'
import type { TenantRepository } from '../../../ports/repositories/tenant.repository'
import type { Tenant, CreateTenantDTO, UpdateTenantDTO, LimitCheck } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import { ok, err } from '../../../errors/result'
import { NotFoundError, InternalError, type DomainError } from '../../../errors/domain-errors'

export class SupabaseTenantRepository implements TenantRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Result<Tenant, NotFoundError>> {
    const { data, error } = await this.client
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return err(new NotFoundError('Tenant no encontrado', { table: 'tenants', id }))
    }

    return ok(this.mapToTenant(data))
  }

  async findAll(): Promise<Result<Tenant[], never>> {
    const { data, error } = await this.client
      .from('tenants')
      .select('*')

    if (error) {
      return ok([])
    }

    return ok((data || []).map(this.mapToTenant))
  }

  async create(data: CreateTenantDTO): Promise<Result<Tenant, DomainError>> {
    const { data: created, error } = await this.client
      .from('tenants')
      .insert({
        name: data.name,
        max_active_sessions: data.maxActiveSessions ?? 10,
        max_analyses_per_month: data.maxAnalysesPerMonth ?? 50,
      })
      .select()
      .single()

    if (error) {
      return err(new InternalError('Error al crear tenant', { table: 'tenants' }))
    }

    return ok(this.mapToTenant(created))
  }

  async update(id: string, data: UpdateTenantDTO): Promise<Result<Tenant, NotFoundError>> {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.isActive !== undefined) updateData.is_active = data.isActive
    if (data.maxActiveSessions !== undefined) updateData.max_active_sessions = data.maxActiveSessions
    if (data.maxAnalysesPerMonth !== undefined) updateData.max_analyses_per_month = data.maxAnalysesPerMonth

    const { data: updated, error } = await this.client
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !updated) {
      return err(new NotFoundError('Tenant no encontrado', { table: 'tenants', id }))
    }

    return ok(this.mapToTenant(updated))
  }

  async checkSessionLimit(tenantId: string): Promise<Result<LimitCheck, NotFoundError>> {
    const tenantResult = await this.findById(tenantId)
    if (!tenantResult.ok) return tenantResult

    const tenant = tenantResult.value

    const { count } = await this.client
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    const current = count || 0
    const limit = tenant.maxActiveSessions

    return ok({
      allowed: current < limit,
      current,
      limit,
      message: current >= limit
        ? `Límite de sesiones activas alcanzado (${current}/${limit})`
        : undefined,
    })
  }

  async checkAnalysisLimit(tenantId: string): Promise<Result<LimitCheck, NotFoundError>> {
    const tenantResult = await this.findById(tenantId)
    if (!tenantResult.ok) return tenantResult

    const tenant = tenantResult.value

    // Contar análisis del mes actual
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await this.client
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('action', 'analysis')
      .gte('created_at', startOfMonth.toISOString())

    const current = count || 0
    const limit = tenant.maxAnalysesPerMonth

    return ok({
      allowed: current < limit,
      current,
      limit,
      message: current >= limit
        ? `Límite de análisis por mes alcanzado (${current}/${limit})`
        : undefined,
    })
  }

  private mapToTenant(row: Record<string, unknown>): Tenant {
    return {
      id: row.id as string,
      name: row.name as string,
      isActive: row.is_active as boolean,
      maxActiveSessions: row.max_active_sessions as number,
      maxAnalysesPerMonth: row.max_analyses_per_month as number,
    }
  }
}
