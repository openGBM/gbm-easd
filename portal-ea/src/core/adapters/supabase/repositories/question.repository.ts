import type { SupabaseClient } from '@supabase/supabase-js'
import type { QuestionRepository } from '../../../ports/repositories/question.repository'
import type { Question, CreateQuestionDTO } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import { ok, err } from '../../../errors/result'
import { InternalError, type DomainError } from '../../../errors/domain-errors'

export class SupabaseQuestionRepository implements QuestionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByDimensionId(dimensionId: string): Promise<Result<Question[], never>> {
    const { data, error } = await this.client
      .from('questions')
      .select('*')
      .eq('dimension_id', dimensionId)
      .order('display_order', { ascending: true })

    if (error) {
      return ok([])
    }

    return ok((data || []).map(this.mapToQuestion))
  }

  async findByInstrumentVersionId(versionId: string): Promise<Result<Question[], never>> {
    const { data, error } = await this.client
      .from('questions')
      .select('*')
      .eq('instrument_version_id', versionId)
      .order('display_order', { ascending: true })

    if (error) {
      return ok([])
    }

    return ok((data || []).map(this.mapToQuestion))
  }

  async createBatch(questions: CreateQuestionDTO[]): Promise<Result<void, DomainError>> {
    const rows = questions.map(q => ({
      dimension_id: q.dimensionId,
      text: q.text,
      display_order: q.displayOrder,
      type: q.type ?? 'likert',
      is_required: q.isRequired ?? true,
      contributes_to_score: q.contributesToScore ?? true,
    }))

    const { error } = await this.client.from('questions').insert(rows)

    if (error) {
      return err(new InternalError('Error al crear preguntas', { table: 'questions' }))
    }

    return ok(undefined)
  }

  private mapToQuestion(row: Record<string, unknown>): Question {
    return {
      id: row.id as string,
      dimensionId: row.dimension_id as string,
      text: row.text as string,
      displayOrder: row.display_order as number,
    }
  }
}
