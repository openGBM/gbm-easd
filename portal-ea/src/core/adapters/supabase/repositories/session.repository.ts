import type { SupabaseClient } from '@supabase/supabase-js'
import type { SessionRepository } from '../../../ports/repositories/session.repository'
import type { Session, CreateSessionDTO, UpdateSessionDTO, SessionFilters } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import { ok, err } from '../../../errors/result'
import { NotFoundError, ConflictError, InternalError, type DomainError } from '../../../errors/domain-errors'

export class SupabaseSessionRepository implements SessionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Result<Session, NotFoundError>> {
    const { data, error } = await this.client
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return err(new NotFoundError('Sesión no encontrada', { table: 'sessions', id }))
    }

    return ok(this.mapToSession(data))
  }

  async findAll(filters?: SessionFilters): Promise<Result<Session[], never>> {
    let query = this.client.from('sessions').select('*')

    if (filters?.tenantId) {
      query = query.eq('tenant_id', filters.tenantId)
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }
    if (filters?.instrumentId) {
      query = query.eq('instrument_version_id', filters.instrumentId)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      return ok([]) // Queries no fallan con NotFound, retornan vacío
    }

    return ok((data || []).map(this.mapToSession))
  }

  async findByTenantId(tenantId: string, filters?: SessionFilters): Promise<Result<Session[], never>> {
    return this.findAll({ ...filters, tenantId })
  }

  async create(data: CreateSessionDTO): Promise<Result<Session, DomainError>> {
    const { data: created, error } = await this.client
      .from('sessions')
      .insert({
        name: data.name,
        is_active: data.isActive ?? true,
        tenant_id: data.tenantId ?? null,
        instrument_version_id: data.instrumentVersionId ?? null,
      })
      .select()
      .single()

    if (error) {
      return err(new InternalError('Error al crear sesión', { table: 'sessions' }))
    }

    return ok(this.mapToSession(created))
  }

  async update(id: string, data: UpdateSessionDTO): Promise<Result<Session, NotFoundError>> {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.isActive !== undefined) updateData.is_active = data.isActive

    const { data: updated, error } = await this.client
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !updated) {
      return err(new NotFoundError('Sesión no encontrada', { table: 'sessions', id }))
    }

    return ok(this.mapToSession(updated))
  }

  async delete(id: string): Promise<Result<void, NotFoundError>> {
    const { error } = await this.client
      .from('sessions')
      .delete()
      .eq('id', id)

    if (error) {
      return err(new NotFoundError('Sesión no encontrada', { table: 'sessions', id }))
    }

    return ok(undefined)
  }

  async toggleActive(id: string): Promise<Result<Session, NotFoundError>> {
    // Primero obtener el estado actual
    const current = await this.findById(id)
    if (!current.ok) return current

    return this.update(id, { isActive: !current.value.isActive })
  }

  async countActive(tenantId?: string): Promise<Result<number, never>> {
    let query = this.client
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    const { count } = await query

    return ok(count || 0)
  }

  private mapToSession(row: Record<string, unknown>): Session {
    return {
      id: row.id as string,
      name: row.name as string,
      isActive: row.is_active as boolean,
      tenantId: (row.tenant_id as string) || null,
      instrumentVersionId: (row.instrument_version_id as string) || null,
      createdAt: row.created_at as string,
    }
  }
}
