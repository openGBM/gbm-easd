/**
 * Base abstracta para todos los errores de dominio.
 * Cada error tiene un código único, mensaje, y HTTP status asociado.
 * Inmutable por diseño (readonly fields).
 *
 * REGLA: context NUNCA contiene PII (emails, nombres, tokens).
 * Solo metadata técnica (IDs, nombres de tabla, tipo de operación).
 */
export abstract class DomainError {
  abstract readonly code: string
  abstract readonly message: string
  abstract readonly httpStatus: number
  readonly timestamp: string

  constructor(readonly context?: Record<string, string | number | boolean>) {
    this.timestamp = new Date().toISOString()
  }

  /**
   * Serialización safe para HTTP response.
   * NO expone context interno — solo code, message, timestamp.
   */
  toJSON(): { code: string; message: string; timestamp: string } {
    return {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
    }
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND' as const
  readonly httpStatus = 404

  constructor(
    readonly message: string,
    context?: Record<string, string | number | boolean>,
  ) {
    super(context)
  }
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT' as const
  readonly httpStatus = 409

  constructor(
    readonly message: string,
    context?: Record<string, string | number | boolean>,
  ) {
    super(context)
  }
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED' as const
  readonly httpStatus = 401

  constructor(
    readonly message: string = 'No autenticado',
    context?: Record<string, string | number | boolean>,
  ) {
    super(context)
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN' as const
  readonly httpStatus = 403

  constructor(
    readonly message: string = 'Sin permisos para esta operación',
    context?: Record<string, string | number | boolean>,
  ) {
    super(context)
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION' as const
  readonly httpStatus = 400

  constructor(
    readonly message: string,
    readonly fieldErrors: Record<string, string[]>,
    context?: Record<string, string | number | boolean>,
  ) {
    super(context)
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      fieldErrors: this.fieldErrors,
    }
  }
}

export class RateLimitError extends DomainError {
  readonly code = 'RATE_LIMIT' as const
  readonly httpStatus = 429

  constructor(
    readonly message: string = 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
    context?: Record<string, string | number | boolean>,
  ) {
    super(context)
  }
}

export class ServiceUnavailableError extends DomainError {
  readonly code = 'SERVICE_UNAVAILABLE' as const
  readonly httpStatus = 503

  constructor(
    readonly message: string = 'Servicio no disponible temporalmente',
    context?: Record<string, string | number | boolean>,
  ) {
    super(context)
  }
}

export class InternalError extends DomainError {
  readonly code = 'INTERNAL' as const
  readonly httpStatus = 500

  constructor(
    readonly message: string = 'Error interno del servidor',
    context?: Record<string, string | number | boolean>,
  ) {
    super(context)
  }
}

/** Union type de todos los códigos de error posibles */
export type DomainErrorCode =
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'RATE_LIMIT'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL'
