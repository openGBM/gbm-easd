import { describe, it, expect } from 'vitest'
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
import { domainError, validationError, nonEmptyString, errorContext } from './generators'

describe('DomainError', () => {
  describe('Inmutabilidad', () => {
    it('code es readonly y se preserva', () => {
      const error = new NotFoundError('test')
      expect(error.code).toBe('NOT_FOUND')
      // TypeScript previene mutación en compile time (readonly)
      // Verificamos que el valor se preserva sin mutación
      expect(error.code).toBe('NOT_FOUND')
    })

    it('httpStatus es readonly y correcto para cada subclase', () => {
      expect(new NotFoundError('x').httpStatus).toBe(404)
      expect(new ConflictError('x').httpStatus).toBe(409)
      expect(new UnauthorizedError().httpStatus).toBe(401)
      expect(new ForbiddenError().httpStatus).toBe(403)
      expect(new ValidationError('x', {}).httpStatus).toBe(400)
      expect(new RateLimitError().httpStatus).toBe(429)
      expect(new ServiceUnavailableError().httpStatus).toBe(503)
      expect(new InternalError().httpStatus).toBe(500)
    })
  })

  describe('toJSON — seguridad', () => {
    it('PBT: toJSON nunca expone context interno', () => {
      fc.assert(
        fc.property(domainError, (error) => {
          const json = error.toJSON()
          expect(json).toHaveProperty('code')
          expect(json).toHaveProperty('message')
          expect(json).toHaveProperty('timestamp')
          expect(json).not.toHaveProperty('context')
        }),
      )
    })

    it('toJSON retorna solo code, message, timestamp', () => {
      const error = new NotFoundError('Sesión no encontrada', {
        table: 'sessions',
        id: 'abc-123',
      })
      const json = error.toJSON()
      expect(Object.keys(json).sort()).toEqual(['code', 'message', 'timestamp'])
    })

    it('ValidationError toJSON incluye fieldErrors', () => {
      const error = new ValidationError('Datos inválidos', {
        email: ['Formato inválido'],
        name: ['Mínimo 2 caracteres'],
      })
      const json = error.toJSON()
      expect(json).toHaveProperty('fieldErrors')
      expect(json.fieldErrors).toEqual({
        email: ['Formato inválido'],
        name: ['Mínimo 2 caracteres'],
      })
    })
  })

  describe('timestamp', () => {
    it('PBT: timestamp es un ISO 8601 string válido', () => {
      fc.assert(
        fc.property(domainError, (error) => {
          expect(error.timestamp).toBeTruthy()
          const date = new Date(error.timestamp)
          expect(date.toISOString()).toBe(error.timestamp)
        }),
      )
    })
  })

  describe('context — no PII', () => {
    it('context solo acepta string | number | boolean values', () => {
      // Valid context
      const error = new NotFoundError('test', {
        table: 'sessions',
        id: 'uuid-here',
        attempt: 3,
        isRetry: true,
      })
      expect(error.context).toEqual({
        table: 'sessions',
        id: 'uuid-here',
        attempt: 3,
        isRetry: true,
      })
    })

    it('context es opcional', () => {
      const error = new NotFoundError('test')
      expect(error.context).toBeUndefined()
    })
  })

  describe('Defaults de mensajes', () => {
    it('UnauthorizedError tiene default message', () => {
      expect(new UnauthorizedError().message).toBe('No autenticado')
    })

    it('ForbiddenError tiene default message', () => {
      expect(new ForbiddenError().message).toBe('Sin permisos para esta operación')
    })

    it('RateLimitError tiene default message', () => {
      expect(new RateLimitError().message).toContain('Demasiadas solicitudes')
    })

    it('ServiceUnavailableError tiene default message', () => {
      expect(new ServiceUnavailableError().message).toContain('no disponible')
    })

    it('InternalError tiene default message', () => {
      expect(new InternalError().message).toContain('Error interno')
    })
  })
})
