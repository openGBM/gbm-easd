import pino from 'pino'
import type { Logger } from '../ports/observability/logger'

/**
 * PinoLogger — Implementación del Logger port con Pino.
 *
 * - Producción: JSON a stdout (parseable por log aggregators)
 * - Desarrollo: Pretty format con colores (via pino-pretty transport)
 *
 * REGLA SECURITY-03: Nunca loggear PII (emails, tokens, passwords).
 * El context debe contener solo metadata técnica.
 */
export class PinoLogger implements Logger {
  private readonly instance: pino.Logger

  constructor(context?: Record<string, unknown>) {
    const isDev = process.env.NODE_ENV !== 'production'
    const level = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info')

    this.instance = pino({
      level,
      ...(isDev && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }),
      ...(!isDev && {
        formatters: {
          level(label: string) {
            return { level: label }
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
      ...(context && { base: context }),
    })
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (context) {
      this.instance.info(context, message)
    } else {
      this.instance.info(message)
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (context) {
      this.instance.warn(context, message)
    } else {
      this.instance.warn(message)
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const ctx = { ...context, ...(error && { err: { message: error.message, stack: error.stack } }) }
    this.instance.error(ctx, message)
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (context) {
      this.instance.debug(context, message)
    } else {
      this.instance.debug(message)
    }
  }

  child(context: Record<string, unknown>): Logger {
    const childLogger = new PinoLogger()
    // Replace the internal instance with a child
    ;(childLogger as unknown as { instance: pino.Logger }).instance = this.instance.child(context)
    return childLogger
  }
}
