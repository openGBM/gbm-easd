import type { SupabaseClient } from '@supabase/supabase-js'
import type { AnalysisRepository } from '../../../ports/repositories/analysis.repository'
import type { Analysis, CreateAnalysisDTO } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import { ok, err } from '../../../errors/result'
import { InternalError, type DomainError } from '../../../errors/domain-errors'

export class SupabaseAnalysisRepository implements AnalysisRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findBySessionId(sessionId: string): Promise<Result<Analysis[], never>> {
    const { data, error } = await this.client
      .from('session_analyses')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) {
      return ok([])
    }

    return ok((data || []).map(this.mapToAnalysis))
  }

  async create(data: CreateAnalysisDTO): Promise<Result<Analysis, DomainError>> {
    const { data: created, error } = await this.client
      .from('session_analyses')
      .insert({
        session_id: data.sessionId,
        content: data.content,
        model: data.model,
        tokens_used: data.tokensUsed ?? null,
        duration_ms: data.durationMs ?? null,
      })
      .select()
      .single()

    if (error) {
      return err(new InternalError('Error al crear análisis', { table: 'session_analyses' }))
    }

    return ok(this.mapToAnalysis(created))
  }

  async findLatest(sessionId: string): Promise<Result<Analysis | null, never>> {
    const { data, error } = await this.client
      .from('session_analyses')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return ok(null)
    }

    return ok(this.mapToAnalysis(data))
  }

  private mapToAnalysis(row: Record<string, unknown>): Analysis {
    return {
      id: row.id as string,
      sessionId: row.session_id as string,
      content: row.content as string,
      model: row.model as string,
      tokensUsed: (row.tokens_used as number) || null,
      durationMs: (row.duration_ms as number) || null,
      createdAt: row.created_at as string,
    }
  }
}
