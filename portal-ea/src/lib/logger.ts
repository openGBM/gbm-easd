/**
 * Logger centralizado del portal.
 * 
 * Features:
 * - Correlation ID (request ID) para rastrear requests across logs
 * - Logging estructurado con contexto
 * - Integración con Sentry (activar con NEXT_PUBLIC_SENTRY_DSN)
 * - Vercel Log Drain compatible (JSON structured logs van a stdout)
 * 
 * Para activar Sentry:
 * 1. npm install @sentry/nextjs
 * 2. Agregar NEXT_PUBLIC_SENTRY_DSN en env vars
 * 3. Descomentar las líneas de Sentry abajo
 */

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  correlationId?: string
  data?: unknown
  timestamp: string
}

// Genera un correlation ID corto
function generateCorrelationId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// Correlation ID simple sin dependencia de node:async_hooks
// Compatible con browser y server (no usa módulos Node exclusivos)
let currentCorrelationId: string | null = null

/**
 * Obtiene el correlation ID del request actual.
 */
export function getCorrelationId(): string {
  if (currentCorrelationId) return currentCorrelationId
  currentCorrelationId = generateCorrelationId()
  return currentCorrelationId
}

/**
 * Establece el correlation ID para el request actual.
 * Llamar al inicio de un API route.
 */
export function setCorrelationId(id?: string): string {
  currentCorrelationId = id || generateCorrelationId()
  return currentCorrelationId
}

/**
 * Limpia el correlation ID (llamar al final del request).
 */
export function clearCorrelationId(): void {
  currentCorrelationId = null
}

function formatLog(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    entry.level.toUpperCase(),
    entry.correlationId ? `[${entry.correlationId}]` : '',
    entry.context ? `[${entry.context}]` : '',
    entry.message,
  ]
  return parts.filter(Boolean).join(' ')
}

function toStructuredJson(entry: LogEntry): string {
  return JSON.stringify({
    level: entry.level,
    msg: entry.message,
    context: entry.context,
    correlationId: entry.correlationId,
    timestamp: entry.timestamp,
    ...(entry.data && entry.data instanceof Error
      ? { error: { name: (entry.data as Error).name, message: (entry.data as Error).message, stack: (entry.data as Error).stack } }
      : entry.data ? { data: entry.data } : {}),
  })
}

function createLogEntry(level: LogLevel, message: string, context?: string, data?: unknown): LogEntry {
  return {
    level,
    message,
    context,
    correlationId: currentCorrelationId || undefined,
    data,
    timestamp: new Date().toISOString(),
  }
}

const isProduction = process.env.NODE_ENV === 'production'

export const logger = {
  info(message: string, context?: string, data?: unknown) {
    const entry = createLogEntry('info', message, context, data)
    if (isProduction) {
      // Structured JSON para Vercel Log Drain / CloudWatch
      console.log(toStructuredJson(entry))
    } else {
      console.log(formatLog(entry), data || '')
    }
    // Sentry: Sentry.captureMessage(message, { level: 'info', extra: { context, correlationId: entry.correlationId, data } })
  },

  warn(message: string, context?: string, data?: unknown) {
    const entry = createLogEntry('warn', message, context, data)
    if (isProduction) {
      console.warn(toStructuredJson(entry))
    } else {
      console.warn(formatLog(entry), data || '')
    }
    // Sentry: Sentry.captureMessage(message, { level: 'warning', extra: { context, correlationId: entry.correlationId, data } })
  },

  error(message: string, context?: string, data?: unknown) {
    const entry = createLogEntry('error', message, context, data)
    if (isProduction) {
      console.error(toStructuredJson(entry))
    } else {
      console.error(formatLog(entry), data || '')
    }
    // Sentry: Sentry.captureException(data instanceof Error ? data : new Error(message), { extra: { context, correlationId: entry.correlationId } })
  },
}
