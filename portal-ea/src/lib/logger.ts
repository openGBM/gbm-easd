/**
 * Logger centralizado del portal.
 * En desarrollo: console.error
 * En producción: se puede conectar a Sentry, LogRocket, o cualquier servicio.
 * 
 * Para integrar Sentry: npm install @sentry/nextjs y configurar en este archivo.
 */

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  data?: unknown
  timestamp: string
}

function createLogEntry(level: LogLevel, message: string, context?: string, data?: unknown): LogEntry {
  return {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  }
}

export const logger = {
  info(message: string, context?: string, data?: unknown) {
    const entry = createLogEntry('info', message, context, data)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${entry.timestamp}] INFO${context ? ` [${context}]` : ''}: ${message}`, data || '')
    }
    // En producción: enviar a servicio de monitoreo
    // Sentry.captureMessage(message, { level: 'info', extra: { context, data } })
  },

  warn(message: string, context?: string, data?: unknown) {
    const entry = createLogEntry('warn', message, context, data)
    console.warn(`[${entry.timestamp}] WARN${context ? ` [${context}]` : ''}: ${message}`, data || '')
    // En producción: enviar a servicio de monitoreo
    // Sentry.captureMessage(message, { level: 'warning', extra: { context, data } })
  },

  error(message: string, context?: string, data?: unknown) {
    const entry = createLogEntry('error', message, context, data)
    console.error(`[${entry.timestamp}] ERROR${context ? ` [${context}]` : ''}: ${message}`, data || '')
    // En producción: enviar a servicio de monitoreo
    // Sentry.captureException(data instanceof Error ? data : new Error(message), { extra: { context } })
  },
}
