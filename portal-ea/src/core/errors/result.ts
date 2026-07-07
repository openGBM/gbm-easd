import type { DomainError } from './domain-errors'

/**
 * Discriminated union para manejo de resultados sin excepciones.
 * Garantiza que el consumer maneje ambos casos (ok/error) de forma explícita.
 *
 * Propiedades algebraicas (PBT):
 * - ok(x).value === x
 * - err(e).error === e
 * - isOk(ok(x)) === true
 * - isErr(err(e)) === true
 * - !isOk(err(e))
 * - !isErr(ok(x))
 */
export type Result<T, E extends DomainError = DomainError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

/** Crea un Result exitoso con el valor dado */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

/** Crea un Result fallido con el error dado */
export function err<E extends DomainError>(error: E): Result<never, E> {
  return { ok: false, error }
}

/** Type guard: verifica si el Result es exitoso */
export function isOk<T, E extends DomainError>(
  result: Result<T, E>,
): result is { readonly ok: true; readonly value: T } {
  return result.ok
}

/** Type guard: verifica si el Result es un error */
export function isErr<T, E extends DomainError>(
  result: Result<T, E>,
): result is { readonly ok: false; readonly error: E } {
  return !result.ok
}

/** Transforma el valor de un Result exitoso, preserva errores */
export function map<T, U, E extends DomainError>(
  result: Result<T, E>,
  f: (value: T) => U,
): Result<U, E> {
  if (result.ok) {
    return ok(f(result.value))
  }
  return result
}

/** Encadena operaciones que retornan Result (monadic bind) */
export function flatMap<T, U, E extends DomainError>(
  result: Result<T, E>,
  f: (value: T) => Result<U, E>,
): Result<U, E> {
  if (result.ok) {
    return f(result.value)
  }
  return result
}
