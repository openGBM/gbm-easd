// TODO: Replace with actual AWS SDK implementation
import type { AIProvider } from '../../ports/ai/ai-provider'
import type { AICompletion, AICompletionOptions, AIModelInfo } from '../../types/dtos'
import type { Result } from '../../errors/result'
import type { DomainError } from '../../errors/domain-errors'
import { err } from '../../errors/result'
import { ServiceUnavailableError } from '../../errors/domain-errors'

export class BedrockProvider implements AIProvider {
  generateCompletion(_prompt: string, _options?: AICompletionOptions): Promise<Result<AICompletion, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }

  getModelInfo(): AIModelInfo {
    return { name: 'claude-3-sonnet', provider: 'aws-bedrock', maxTokens: 4096 }
  }
}
