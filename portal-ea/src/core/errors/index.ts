export {
  DomainError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  RateLimitError,
  ServiceUnavailableError,
  InternalError,
} from './domain-errors'
export type { DomainErrorCode } from './domain-errors'

export { ok, err, isOk, isErr, map, flatMap } from './result'
export type { Result } from './result'
