/**
 * PBT Generators de dominio reutilizables.
 * Usados por todos los tests de property-based testing.
 */
import * as fc from 'fast-check'
import {
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  RateLimitError,
  ServiceUnavailableError,
  InternalError,
} from '../errors/domain-errors'
import type { DomainError } from '../errors/domain-errors'
import { ok, err } from '../errors/result'
import type { Result } from '../errors/result'
import { ServiceToken } from '../types/tokens'

// ─── Primitive Generators ───────────────────────────────────────────────────

/** Genera un string no vacío (1-100 chars) */
export const nonEmptyString = fc.string({ minLength: 1, maxLength: 100 })

/** Genera un UUID v4 */
export const uuid = fc.uuid()

/** Genera un email válido */
export const email = fc.emailAddress()

/** Genera un entero positivo */
export const positiveInt = fc.integer({ min: 1, max: 10000 })

// ─── DomainError Generators ─────────────────────────────────────────────────

/** Genera un context válido para DomainError (sin PII) */
export const errorContext = fc.option(
  fc.record({
    table: fc.constantFrom('sessions', 'respondents', 'responses', 'dimensions'),
    operation: fc.constantFrom('findById', 'create', 'update', 'delete'),
    id: uuid,
  }),
  { nil: undefined },
)

/** Genera cualquier DomainError */
export const domainError: fc.Arbitrary<DomainError> = fc.oneof(
  fc.tuple(nonEmptyString, errorContext).map(([msg, ctx]) => new NotFoundError(msg, ctx)),
  fc.tuple(nonEmptyString, errorContext).map(([msg, ctx]) => new ConflictError(msg, ctx)),
  fc.tuple(nonEmptyString, errorContext).map(([msg, ctx]) => new UnauthorizedError(msg, ctx)),
  fc.tuple(nonEmptyString, errorContext).map(([msg, ctx]) => new ForbiddenError(msg, ctx)),
  fc.tuple(nonEmptyString, errorContext).map(([msg, ctx]) => new RateLimitError(msg, ctx)),
  fc.tuple(nonEmptyString, errorContext).map(([msg, ctx]) => new ServiceUnavailableError(msg, ctx)),
  fc.tuple(nonEmptyString, errorContext).map(([msg, ctx]) => new InternalError(msg, ctx)),
)

/** Genera un ValidationError con fieldErrors random */
export const validationError = fc
  .tuple(
    nonEmptyString,
    fc.dictionary(
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.array(nonEmptyString, { minLength: 1, maxLength: 3 }),
    ),
  )
  .map(([msg, fields]) => new ValidationError(msg, fields))

// ─── Result Generators ──────────────────────────────────────────────────────

/** Genera un Result<T, DomainError> exitoso con valor arbitrario */
export function okResult<T>(valueArb: fc.Arbitrary<T>): fc.Arbitrary<Result<T, never>> {
  return valueArb.map((v) => ok(v))
}

/** Genera un Result fallido con un DomainError */
export function errResult(): fc.Arbitrary<Result<never, DomainError>> {
  return domainError.map((e) => err(e))
}

/** Genera un Result<T, DomainError> (ok o err) */
export function anyResult<T>(valueArb: fc.Arbitrary<T>): fc.Arbitrary<Result<T, DomainError>> {
  return fc.oneof(okResult(valueArb), errResult())
}

// ─── ServiceToken Generator ─────────────────────────────────────────────────

/** Genera un ServiceToken con nombre único */
export const serviceToken = nonEmptyString.map(
  (name) => new ServiceToken<unknown>(`Test_${name}`),
)
