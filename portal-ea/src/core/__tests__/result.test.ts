import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { ok, err, isOk, isErr, map, flatMap } from '../errors/result'
import { NotFoundError, InternalError } from '../errors/domain-errors'
import { domainError, nonEmptyString } from './generators'

describe('Result type', () => {
  describe('PBT: Invariantes algebraicas', () => {
    it('ok(x).value === x — el valor se preserva sin mutación', () => {
      fc.assert(
        fc.property(fc.anything(), (x) => {
          const result = ok(x)
          expect(result.ok).toBe(true)
          if (result.ok) {
            expect(result.value).toBe(x)
          }
        }),
      )
    })

    it('err(e).error === e — el error se preserva sin mutación', () => {
      fc.assert(
        fc.property(domainError, (e) => {
          const result = err(e)
          expect(result.ok).toBe(false)
          if (!result.ok) {
            expect(result.error).toBe(e)
          }
        }),
      )
    })

    it('isOk(ok(x)) === true', () => {
      fc.assert(
        fc.property(fc.anything(), (x) => {
          expect(isOk(ok(x))).toBe(true)
        }),
      )
    })

    it('isErr(err(e)) === true', () => {
      fc.assert(
        fc.property(domainError, (e) => {
          expect(isErr(err(e))).toBe(true)
        }),
      )
    })

    it('!isOk(err(e)) — err nunca es confundido con ok', () => {
      fc.assert(
        fc.property(domainError, (e) => {
          expect(isOk(err(e))).toBe(false)
        }),
      )
    })

    it('!isErr(ok(x)) — ok nunca es confundido con err', () => {
      fc.assert(
        fc.property(fc.anything(), (x) => {
          expect(isErr(ok(x))).toBe(false)
        }),
      )
    })
  })

  describe('PBT: map', () => {
    it('map(ok(x), id) === ok(x) — identity law', () => {
      fc.assert(
        fc.property(fc.integer(), (x) => {
          const result = map(ok(x), (v) => v)
          expect(result.ok).toBe(true)
          if (result.ok) {
            expect(result.value).toBe(x)
          }
        }),
      )
    })

    it('map(err(e), f) === err(e) — errores se preservan', () => {
      fc.assert(
        fc.property(domainError, (e) => {
          const result = map(err(e), () => 'transformed')
          expect(result.ok).toBe(false)
          if (!result.ok) {
            expect(result.error).toBe(e)
          }
        }),
      )
    })

    it('map composition: map(map(r, f), g) === map(r, x => g(f(x)))', () => {
      fc.assert(
        fc.property(fc.integer(), (x) => {
          const f = (n: number) => n * 2
          const g = (n: number) => n + 1

          const composed = map(ok(x), (v) => g(f(v)))
          const sequential = map(map(ok(x), f), g)

          expect(composed).toEqual(sequential)
        }),
      )
    })
  })

  describe('PBT: flatMap', () => {
    it('flatMap(ok(x), f) === f(x) — left identity', () => {
      fc.assert(
        fc.property(fc.integer(), (x) => {
          const f = (n: number) => ok(n * 2)
          const result = flatMap(ok(x), f)
          expect(result).toEqual(f(x))
        }),
      )
    })

    it('flatMap(r, ok) === r — right identity', () => {
      fc.assert(
        fc.property(fc.integer(), (x) => {
          const r = ok(x)
          const result = flatMap(r, ok)
          expect(result).toEqual(r)
        }),
      )
    })

    it('flatMap(err(e), f) === err(e) — errores se preservan', () => {
      fc.assert(
        fc.property(domainError, (e) => {
          const result = flatMap(err(e), () => ok('never reached'))
          expect(result.ok).toBe(false)
          if (!result.ok) {
            expect(result.error).toBe(e)
          }
        }),
      )
    })
  })

  describe('Ejemplo: uso típico con narrowing', () => {
    it('puede acceder a value después de check ok', () => {
      const result = ok(42)
      if (isOk(result)) {
        expect(result.value).toBe(42)
      }
    })

    it('puede acceder a error después de check err', () => {
      const error = new NotFoundError('No encontrado', { table: 'sessions' })
      const result = err(error)
      if (isErr(result)) {
        expect(result.error.code).toBe('NOT_FOUND')
        expect(result.error.httpStatus).toBe(404)
      }
    })
  })
})
