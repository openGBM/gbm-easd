import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIProvider } from '../../ports/ai/ai-provider'
import type { AICompletion, AICompletionOptions, AIModelInfo } from '../../types/dtos'
import type { Result } from '../../errors/result'
import { ok, err } from '../../errors/result'
import { ServiceUnavailableError } from '../../errors/domain-errors'

export class GeminiProvider implements AIProvider {
  private readonly genAI: GoogleGenerativeAI
  private readonly modelName = 'gemini-2.0-flash'

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  async generateCompletion(prompt: string, options?: AICompletionOptions): Promise<Result<AICompletion, ServiceUnavailableError>> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          maxOutputTokens: options?.maxTokens ?? 3000,
          temperature: options?.temperature ?? 0.7,
        },
      })

      const start = performance.now()

      // Retry una vez en caso de rate limit (429)
      let attempts = 0
      while (attempts < 2) {
        try {
          const result = await model.generateContent(
            options?.systemPrompt
              ? `${options.systemPrompt}\n\n${prompt}`
              : prompt,
          )
          const durationMs = Math.round(performance.now() - start)
          const usage = result.response.usageMetadata

          return ok({
            content: result.response.text(),
            model: this.modelName,
            tokensUsed: (usage?.promptTokenCount || 0) + (usage?.candidatesTokenCount || 0),
            durationMs,
          })
        } catch (e: unknown) {
          attempts++
          const error = e as { status?: number }
          if (error?.status === 429 && attempts < 2) {
            await new Promise(resolve => setTimeout(resolve, 3000))
            continue
          }
          throw e
        }
      }

      return err(new ServiceUnavailableError('Gemini no disponible después de reintentos'))
    } catch (e: unknown) {
      return err(new ServiceUnavailableError(
        'Error al generar con Gemini',
        { provider: 'gemini', model: this.modelName },
      ))
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.GEMINI_API_KEY
  }

  getModelInfo(): AIModelInfo {
    return {
      name: this.modelName,
      provider: 'google',
      maxTokens: 8192,
    }
  }
}
