import type { Result } from '../../errors'
import type { DomainError } from '../../errors'
import type { Question, CreateQuestionDTO } from '../../types/dtos'

export interface QuestionRepository {
  findByDimensionId(dimensionId: string): Promise<Result<Question[], DomainError>>
  findByInstrumentVersionId(versionId: string): Promise<Result<Question[], DomainError>>
  createBatch(questions: CreateQuestionDTO[]): Promise<Result<void, DomainError>>
}
