import type { SupabaseClient } from '@supabase/supabase-js'
import type { RespondentRepository } from '../../../ports/repositories/respondent.repository'
import type { Respondent, CreateRespondentDTO } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import { ok, err } from '../../../errors/result'
import { NotFoundError, ConflictError, InternalError } from '../../../errors/domain-errors'

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
