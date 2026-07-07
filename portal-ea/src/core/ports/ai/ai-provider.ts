import type { Result } from '../../errors'
import type { DomainError } from '../../errors'
import type { AICompletion, AICompletionOptions, AIModelInfo } from '../../types/dtos'

export interface AIProvider {
  generateCompletion(prompt: string, options?: AICompletionOptions): Promise<Result<AICompletion, DomainError>>
  isAvailable(): Promise<boolean>
  getModelInfo(): AIModelInfo
}
