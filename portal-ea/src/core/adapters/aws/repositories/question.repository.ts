// TODO: Replace with actual AWS SDK implementation
import type { QuestionRepository } from '../../../ports/repositories/question.repository'
import type { Question, CreateQuestionDTO } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import type { DomainError } from '../../../errors/domain-errors'
import { err } from '../../../errors/result'
import { ServiceUnavailableError } from '../../../errors/domain-errors'

export class AwsQuestionRepository implements QuestionRepository {
  findByDimensionId(_dimensionId: string): Promise<Result<Question[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  findByInstrumentVersionId(_versionId: string): Promise<Result<Question[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  createBatch(_questions: CreateQuestionDTO[]): Promise<Result<void, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }
}
