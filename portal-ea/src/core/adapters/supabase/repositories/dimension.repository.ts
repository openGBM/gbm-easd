import type { SupabaseClient } from '@supabase/supabase-js'
import type { DimensionRepository } from '../../../ports/repositories/dimension.repository'
import type { Dimension, DimensionWithQuestions, Question } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import { ok, err } from '../../../errors/result'
import { InternalError } from '../../../errors/domain-errors'

export class SupabaseDimensionRepository implements DimensionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(): Promise<Result<Dimension[], never>> {
    const { data, error } = await this.client
      .from('dimensions')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      return ok([])
    }

    return ok((data || []).map(this.mapToDimension))
  }

  async findWithQuestions(): Promise<Result<DimensionWithQuestions[], never>> {
    const { data, error } = await this.client
      .from('dimensions')
      .select(`
        *,
        questions(*)
      `)
      .order('display_order', { ascending: true })
      .order('display_order', { ascending: true, referencedTable: 'questions' })

    if (error) {
      return ok([])
    }

    return ok((data || []).map(this.mapToDimensionWithQuestions))
  }

  async findByInstrumentVersionId(versionId: string): Promise<Result<DimensionWithQuestions[], never>> {
    const { data, error } = await this.client
      .from('dimensions')
      .select(`
        *,
        questions!inner(*)
      `)
      .eq('questions.instrument_version_id', versionId)
      .order('display_order', { ascending: true })
      .order('display_order', { ascending: true, referencedTable: 'questions' })

    if (error) {
      return ok([])
    }

    return ok((data || []).map(this.mapToDimensionWithQuestions))
  }

  private mapToDimension(row: Record<string, unknown>): Dimension {
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      displayOrder: row.display_order as number,
      color: row.color as string,
    }
  }

  private mapToDimensionWithQuestions(row: Record<string, unknown>): DimensionWithQuestions {
    const questions = (row.questions as Record<string, unknown>[]) || []
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      displayOrder: row.display_order as number,
      color: row.color as string,
      questions: questions.map((q): Question => ({
        id: q.id as string,
        dimensionId: q.dimension_id as string,
        text: q.text as string,
        displayOrder: q.display_order as number,
      })),
    }
  }
}
