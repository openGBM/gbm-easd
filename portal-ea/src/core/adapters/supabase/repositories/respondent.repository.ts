import type { SupabaseClient } from '@supabase/supabase-js'
import type { RespondentRepository } from '../../../ports/repositories/respondent.repository'
import type { Respondent, CreateRespondentDTO } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import { ok, err } from '../../../errors/result'
import { NotFoundError, ConflictError, InternalError, type DomainError } from '../../../errors/domain-errors'

export class SupabaseRespondentRepository implements RespondentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Result<Respondent, NotFoundError>> {
    const { data, error } = await this.client
      .from('respondents')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return err(new NotFoundError('Encuestado no encontrado', { table: 'respondents', id }))
    }

    return ok(this.mapToRespondent(data))
  }

  async findBySessionId(sessionId: string): Promise<Result<Respondent[], never>> {
    const { data } = await this.client
      .from('respondents')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    return ok((data || []).map(this.mapToRespondent))
  }

  async findByEmail(sessionId: string, email: string): Promise<Result<Respondent | null, never>> {
    const { data } = await this.client
      .from('respondents')
      .select('*')
      .eq('session_id', sessionId)
      .eq('email', email)
      .single()

    if (!data) return ok(null)
    return ok(this.mapToRespondent(data))
  }

  async create(data: CreateRespondentDTO): Promise<Result<Respondent, ConflictError>> {
    const { data: created, error } = await this.client
      .from('respondents')
      .insert({
        session_id: data.sessionId,
        name: data.name,
        email: data.email,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return err(new ConflictError('Email ya registrado en esta sesión', { table: 'respondents' }))
      }
      return err(new InternalError('Error al registrar encuestado', { table: 'respondents' }) as never)
    }

    return ok(this.mapToRespondent(created))
  }

  async markCompleted(id: string): Promise<Result<void, NotFoundError>> {
    const { error } = await this.client
      .from('respondents')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return err(new NotFoundError('Encuestado no encontrado', { table: 'respondents', id }))
    }

    return ok(undefined)
  }

  async delete(id: string): Promise<Result<void, NotFoundError>> {
    // Eliminar respuestas asociadas primero
    await this.client.from('responses').delete().eq('respondent_id', id)

    const { error } = await this.client
      .from('respondents')
      .delete()
      .eq('id', id)

    if (error) {
      return err(new NotFoundError('Encuestado no encontrado', { table: 'respondents', id }))
    }

    return ok(undefined)
  }

  async countBySession(sessionId: string): Promise<Result<number, never>> {
    const { count } = await this.client
      .from('respondents')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)

    return ok(count || 0)
  }

  async countCompleted(tenantId?: string): Promise<Result<number, DomainError>> {
    let query = this.client
      .from('respondents')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true)

    // Note: filtering by tenant requires joining through sessions
    // For now, counts all completed respondents
    const { count } = await query
    return ok(count || 0)
  }

  async findCompletedWithTiming(tenantId?: string): Promise<Result<{ createdAt: string; completedAt: string }[], DomainError>> {
    const { data } = await this.client
      .from('respondents')
      .select('created_at, completed_at')
      .eq('completed', true)
      .not('completed_at', 'is', null)

    if (!data) return ok([])
    return ok(data.map((r: any) => ({ createdAt: r.created_at, completedAt: r.completed_at })))
  }

  async deleteBySessionId(sessionId: string): Promise<Result<void, DomainError>> {
    // First delete all responses for respondents in this session
    const { data: respondents } = await this.client
      .from('respondents')
      .select('id')
      .eq('session_id', sessionId)

    if (respondents && respondents.length > 0) {
      const ids = respondents.map((r: any) => r.id)
      await this.client.from('responses').delete().in('respondent_id', ids)
    }

    // Then delete respondents
    await this.client.from('respondents').delete().eq('session_id', sessionId)
    return ok(undefined)
  }

  private mapToRespondent(row: Record<string, unknown>): Respondent {
    return {
      id: row.id as string,
      sessionId: row.session_id as string,
      name: row.name as string,
      email: row.email as string,
      completed: row.completed as boolean,
      createdAt: row.created_at as string,
    }
  }
}
