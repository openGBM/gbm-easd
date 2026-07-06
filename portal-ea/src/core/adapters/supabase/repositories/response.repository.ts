import type { SupabaseClient } from '@supabase/supabase-js'
import type { ResponseRepository } from '../../../ports/repositories/response.repository'
import type { ResponseWithQuestion, CreateResponseDTO, DimensionScore, RawResponse } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import { ok, err } from '../../../errors/result'
import { InternalError, type DomainError } from '../../../errors/domain-errors'

export class SupabaseResponseRepository implements ResponseRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByRespondentId(respondentId: string): Promise<Result<ResponseWithQuestion[], never>> {
    const { data } = await this.client
      .from('responses')
      .select(`
        *,
        questions!inner(id, dimension_id, text, display_order),
        questions!inner(dimensions!inner(id, name, description, display_order, color))
      `)
      .eq('respondent_id', respondentId)

    if (!data) return ok([])

    return ok(data.map(this.mapToResponseWithQuestion))
  }

  async findBySessionId(sessionId: string): Promise<Result<ResponseWithQuestion[], never>> {
    const { data } = await this.client
      .from('responses')
      .select(`
        *,
        respondents!inner(session_id),
        questions!inner(id, dimension_id, text, display_order,
          dimensions!inner(id, name, description, display_order, color)
        )
      `)
      .eq('respondents.session_id', sessionId)

    if (!data) return ok([])

    return ok(data.map(this.mapToResponseWithQuestion))
  }

  async upsertBatch(respondentId: string, responses: CreateResponseDTO[]): Promise<Result<void, DomainError>> {
    const rows = responses.map((r) => ({
      respondent_id: respondentId,
      question_id: r.questionId,
      value: r.value,
      ...(r.textValue !== undefined && { text_value: r.textValue }),
    }))

    const { error } = await this.client
      .from('responses')
      .upsert(rows, { onConflict: 'respondent_id,question_id' })

    if (error) {
      return err(new InternalError('Error al guardar respuestas', { table: 'responses' }))
    }

    return ok(undefined)
  }

  async getAggregatedBySession(sessionId: string): Promise<Result<DimensionScore[], never>> {
    // Obtener todas las respuestas de la sesión con dimensiones
    const { data } = await this.client
      .from('responses')
      .select(`
        value,
        questions!inner(
          dimension_id,
          contributes_to_score,
          dimensions!inner(name, color)
        ),
        respondents!inner(session_id, completed)
      `)
      .eq('respondents.session_id', sessionId)
      .eq('respondents.completed', true)

    if (!data || data.length === 0) return ok([])

    return ok(this.aggregateScores(data))
  }

  async getAggregatedByRespondent(respondentId: string): Promise<Result<DimensionScore[], never>> {
    const { data } = await this.client
      .from('responses')
      .select(`
        value,
        questions!inner(
          dimension_id,
          contributes_to_score,
          dimensions!inner(name, color)
        )
      `)
      .eq('respondent_id', respondentId)

    if (!data || data.length === 0) return ok([])

    return ok(this.aggregateScores(data))
  }

  async findRawByRespondentId(respondentId: string): Promise<Result<RawResponse[], DomainError>> {
    const { data } = await this.client
      .from('responses')
      .select('question_id, value, text_value')
      .eq('respondent_id', respondentId)

    if (!data) return ok([])
    return ok(data.map((r: any) => ({
      questionId: r.question_id as string,
      value: r.value as number | null,
      textValue: (r.text_value as string) || null,
    })))
  }

  async findByRespondentIds(respondentIds: string[]): Promise<Result<ResponseWithQuestion[], DomainError>> {
    if (respondentIds.length === 0) return ok([])

    const { data } = await this.client
      .from('responses')
      .select(`
        *,
        questions!inner(id, dimension_id, text, display_order,
          dimensions!inner(id, name, description, display_order, color)
        )
      `)
      .in('respondent_id', respondentIds)

    if (!data) return ok([])
    return ok(data.map(this.mapToResponseWithQuestion))
  }

  async deleteByRespondentId(respondentId: string): Promise<Result<void, DomainError>> {
    await this.client.from('responses').delete().eq('respondent_id', respondentId)
    return ok(undefined)
  }

  async deleteByRespondentIds(respondentIds: string[]): Promise<Result<void, DomainError>> {
    if (respondentIds.length === 0) return ok(undefined)
    await this.client.from('responses').delete().in('respondent_id', respondentIds)
    return ok(undefined)
  }

  private aggregateScores(data: Record<string, unknown>[]): DimensionScore[] {
    const dimensionMap = new Map<string, { name: string; color: string; values: number[] }>()

    for (const row of data) {
      const question = row.questions as Record<string, unknown>
      const dimension = question.dimensions as Record<string, unknown>
      const contributesToScore = question.contributes_to_score !== false
      const value = row.value as number

      if (!contributesToScore || value === 0) continue

      const dimName = dimension.name as string
      if (!dimensionMap.has(dimName)) {
        dimensionMap.set(dimName, {
          name: dimName,
          color: dimension.color as string,
          values: [],
        })
      }
      dimensionMap.get(dimName)!.values.push(value)
    }

    return Array.from(dimensionMap.values()).map(({ name, color, values }) => ({
      dimensionName: name,
      dimensionColor: color,
      averageValue: values.reduce((sum, v) => sum + v, 0) / values.length,
      responseCount: values.length,
    }))
  }

  private mapToResponseWithQuestion(row: Record<string, unknown>): ResponseWithQuestion {
    const question = row.questions as Record<string, unknown>
    const dimension = question.dimensions as Record<string, unknown>

    return {
      id: row.id as string,
      respondentId: row.respondent_id as string,
      questionId: row.question_id as string,
      value: row.value as number,
      createdAt: row.created_at as string,
      question: {
        id: question.id as string,
        dimensionId: question.dimension_id as string,
        text: question.text as string,
        displayOrder: question.display_order as number,
      },
      dimension: {
        id: dimension.id as string,
        name: dimension.name as string,
        description: dimension.description as string,
        displayOrder: dimension.display_order as number,
        color: dimension.color as string,
      },
    }
  }
}
