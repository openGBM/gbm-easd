/**
 * Rate limiting usando Upstash Redis.
 * Si no hay credenciales de Upstash configuradas, usa un fallback en memoria
 * (solo para desarrollo local — no apto para múltiples instancias en producción).
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Rate limiter para endpoints públicos (registro de encuestados)
// 10 requests por minuto por IP
let publicLimiter: Ratelimit | null = null

// Rate limiter para API de análisis IA (más restrictivo)
// 5 requests por minuto por usuario
let analysisLimiter: Ratelimit | null = null

function initLimiters() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) {
    const redis = new Redis({ url, token })

    publicLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'rl:public',
    })

    analysisLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      prefix: 'rl:analysis',
    })
  }
}

initLimiters()

/**
 * Fallback en memoria para desarrollo sin Upstash.
 * Usa un Map simple con TTL de 60 segundos.
 */
const memoryStore = new Map<string, { count: number; resetAt: number }>()

function memoryRateLimit(key: string, limit: number, windowMs: number = 60000): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count }
}

/**
 * Verifica rate limit para endpoints públicos.
 * @param identifier - IP del cliente o identificador único
 * @returns { success, remaining } o null si rate limiting está deshabilitado
 */
export async function checkPublicRateLimit(identifier: string): Promise<{ success: boolean; remaining: number }> {
  if (publicLimiter) {
    const result = await publicLimiter.limit(identifier)
    return { success: result.success, remaining: result.remaining }
  }
  // Fallback en memoria (desarrollo)
  return memoryRateLimit(`public:${identifier}`, 10)
}

/**
 * Verifica rate limit para el endpoint de análisis IA.
 * @param identifier - Email del admin o IP
 * @returns { success, remaining }
 */
export async function checkAnalysisRateLimit(identifier: string): Promise<{ success: boolean; remaining: number }> {
  if (analysisLimiter) {
    const result = await analysisLimiter.limit(identifier)
    return { success: result.success, remaining: result.remaining }
  }
  // Fallback en memoria (desarrollo)
  return memoryRateLimit(`analysis:${identifier}`, 5)
}
