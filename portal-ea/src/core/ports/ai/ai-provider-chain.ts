import type { Result } from '../../errors'
import type { DomainError } from '../../errors'
import type { AICompletion, AICompletionOptions, AIModelInfo } from '../../types/dtos'

export interface AIProviderChain {
  generate(prompt: string, options?: AICompletionOptions): Promise<Result<AICompletion, DomainError>>
  getActiveProvider(): AIModelInfo
  getProviderOrder(): AIModelInfo[]
}
