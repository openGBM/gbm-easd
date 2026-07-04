import Groq from 'groq-sdk'
import type { AIProvider } from '../../ports/ai/ai-provider'
import type { AICompletion, AICompletionOptions, AIModelInfo } from '../../types/dtos'
import type { Result } from '../../errors/result'
import { ok, err } from '../../errors/result'
import { ServiceUnavailableError } from '../../errors/domain-errors'

export class GroqProvider implements AIProvider {
  private readonly groq: Groq
  private readonly modelName = 'llama-3.3-70b-versatile'

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey })
  }

  async generateCompletion(prompt: string, options?: AICompletionOptions): Promise<Result<AICompletion, ServiceUnavailableError>> {
    try {
      const start = performance.now()

      const messages: { role: 'system' | 'user'; content: string }[] = []

      if (options?.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt })
      } else {
        messages.push({
          role: 'system',
          content: 'Eres un consultor experto en Arquitectura Empresarial. Responde siempre en español.',
        })
      }

      messages.push({ role: 'user', content: prompt })

      const completion = await this.groq.chat.completions.create({
        messages,
        model: this.modelName,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 3000,
      })

      const durationMs = Math.round(performance.now() - start)
      const content = completion.choices[0]?.message?.content || ''

      return ok({
        content,
        model: this.modelName,
        tokensUsed: (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0),
        durationMs,
      })
    } catch {
      return err(new ServiceUnavailableError(
        'Error al generar con Groq',
        { provider: 'groq', model: this.modelName },
      ))
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.GROQ_API_KEY
  }

  getModelInfo(): AIModelInfo {
    return {
      name: this.modelName,
      provider: 'groq',
      maxTokens: 8192,
    }
  }
}
