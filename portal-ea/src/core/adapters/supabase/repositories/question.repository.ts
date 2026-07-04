import type { SupabaseClient } from '@supabase/supabase-js'
import type { QuestionRepository } from '../../../ports/repositories/question.repository'
import type { Question } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import { ok, err } from '../../../errors/result'
import { InternalError } from '../../../errors/domain-errors'

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

  private mapToQuestion(row: Record<string, unknown>): Question {
    return {
      id: row.id as string,
      dimensionId: row.dimension_id as string,
      text: row.text as string,
      displayOrder: row.display_order as number,
    }
  }
}
