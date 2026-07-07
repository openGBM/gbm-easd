import type { Logger } from '../ports/observability/logger'
import type { MetricsCollector } from '../ports/observability/metrics'

/**
 * InstrumentedRepository — Decorator genérico que agrega logging + metrics
 * a cualquier repositorio.
 *
 * Intercepta cada método del repositorio inner y:
 * 1. Registra inicio (debug log)
 * 2. Mide duración
 * 3. Registra resultado (info/error log)
 * 4. Emite métricas (latencia, errores)
 *
 * Uso:
 *   const rawRepo = new SupabaseSessionRepository(client)
 *   const repo = instrumentRepository(rawRepo, 'SessionRepository', logger, metrics)
 */
export function instrumentRepository<T extends object>(
  inner: T,
  repositoryName: string,
  logger: Logger,
  metrics: MetricsCollector,
): T {
  return new Proxy(inner, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)

      // Solo interceptar funciones (métodos)
      if (typeof value !== 'function') return value

      const methodName = String(prop)
      const operationName = `${repositoryName}.${methodName}`

      return async (...args: unknown[]) => {
        const start = performance.now()

        logger.debug(`${operationName} start`, {
          repository: repositoryName,
          method: methodName,
        })

        try {
          const result = await (value as Function).apply(target, args)
          const durationMs = Math.round((performance.now() - start) * 100) / 100

          // Registrar métrica de latencia
          metrics.recordLatency(operationName, durationMs)

          // Verificar si es un Result con error
          if (result && typeof result === 'object' && 'ok' in result && !result.ok) {
            const errorCode = result.error?.code || 'UNKNOWN'
            metrics.recordError(operationName, errorCode)
            logger.warn(`${operationName} failed`, {
              repository: repositoryName,
              method: methodName,
              durationMs,
              errorCode,
            })
          } else {
            logger.debug(`${operationName} complete`, {
              repository: repositoryName,
              method: methodName,
              durationMs,
            })
          }

          return result
        } catch (error) {
          const durationMs = Math.round((performance.now() - start) * 100) / 100
          metrics.recordError(operationName, 'EXCEPTION')

          logger.error(`${operationName} threw exception`, error as Error, {
            repository: repositoryName,
            method: methodName,
            durationMs,
          })

          throw error
        }
      }
    },
  }) as T
}
