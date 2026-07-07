import type { AIProviderChain } from '../../ports/ai/ai-provider-chain'
import type { AIProvider } from '../../ports/ai/ai-provider'
import type { AICompletion, AICompletionOptions, AIModelInfo } from '../../types/dtos'
import type { Result } from '../../errors/result'
import { ok, err, isOk } from '../../errors/result'
import { ServiceUnavailableError } from '../../errors/domain-errors'

/**
 * DefaultAIProviderChain — Implementa failover entre múltiples AI providers.
 *
 * Intenta cada provider en orden. Si uno falla o no está disponible, pasa al siguiente.
 * Si todos fallan, retorna ServiceUnavailableError.
 *
 * Configuración del orden vía env var: AI_PROVIDERS=gemini,groq
 */
export class DefaultAIProviderChain implements AIProviderChain {
  private readonly providers: AIProvider[]

  constructor(providers: AIProvider[]) {
    this.providers = providers
  }

  async generate(prompt: string, options?: AICompletionOptions): Promise<Result<AICompletion, ServiceUnavailableError>> {
    for (const provider of this.providers) {
      // Verificar disponibilidad
      const available = await provider.isAvailable()
      if (!available) continue

      // Intentar generar
      const result = await provider.generateCompletion(prompt, options)
      if (isOk(result)) {
        return result
      }

      // Provider falló — continuar con el siguiente
    }

    return err(new ServiceUnavailableError(
      'No se pudo generar el análisis. Todos los proveedores de IA fallaron.',
      { providers: this.providers.map(p => p.getModelInfo().provider).join(',') },
    ))
  }

  getActiveProvider(): AIModelInfo {
    // Retorna el primer provider disponible (sync, basado en config)
    return this.providers[0]?.getModelInfo() ?? { name: 'none', provider: 'none', maxTokens: 0 }
  }

  getProviderOrder(): AIModelInfo[] {
    return this.providers.map(p => p.getModelInfo())
  }
}
