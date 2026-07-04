import { describe, it, expect } from 'vitest'
import { ContainerImpl } from '../container-impl'
import { ServiceToken } from '../types/tokens'
import { InternalError } from '../errors/domain-errors'

describe('ContainerImpl', () => {
  describe('register & resolve', () => {
    it('resuelve un token registrado correctamente', () => {
      const container = new ContainerImpl()
      const token = new ServiceToken<string>('TestString')
      container.register(token, () => 'hello')

      expect(container.resolve(token)).toBe('hello')
    })

    it('resuelve objetos complejos', () => {
      const container = new ContainerImpl()
      const token = new ServiceToken<{ name: string; count: number }>('TestObj')
      container.register(token, () => ({ name: 'test', count: 42 }))

      const result = container.resolve(token)
      expect(result.name).toBe('test')
      expect(result.count).toBe(42)
    })
  })

  describe('singleton scope', () => {
    it('retorna la misma instancia en múltiples resolves (singleton)', () => {
      const container = new ContainerImpl()
      const token = new ServiceToken<object>('TestSingleton')
      container.register(token, () => ({ id: Math.random() }), 'singleton')

      const first = container.resolve(token)
      const second = container.resolve(token)
      expect(first).toBe(second) // misma referencia
    })

    it('singleton es el scope default', () => {
      const container = new ContainerImpl()
      const token = new ServiceToken<object>('TestDefault')
      container.register(token, () => ({ id: Math.random() }))

      const first = container.resolve(token)
      const second = container.resolve(token)
      expect(first).toBe(second)
    })
  })

  describe('transient scope', () => {
    it('retorna una nueva instancia en cada resolve (transient)', () => {
      const container = new ContainerImpl()
      const token = new ServiceToken<object>('TestTransient')
      container.register(token, () => ({ id: Math.random() }), 'transient')

      const first = container.resolve(token)
      const second = container.resolve(token)
      expect(first).not.toBe(second) // diferentes referencias
    })
  })

  describe('fail-fast behavior', () => {
    it('lanza InternalError si se resuelve un token no registrado', () => {
      const container = new ContainerImpl()
      const token = new ServiceToken<string>('Unregistered')

      expect(() => container.resolve(token)).toThrow(InternalError)
      try {
        container.resolve(token)
      } catch (e) {
        expect(e).toBeInstanceOf(InternalError)
        expect((e as InternalError).message).toContain('Unregistered')
        expect((e as InternalError).message).toContain('no registrado')
      }
    })

    it('lanza InternalError si se intenta registrar un token duplicado', () => {
      const container = new ContainerImpl()
      const token = new ServiceToken<string>('Duplicate')
      container.register(token, () => 'first')

      expect(() => container.register(token, () => 'second')).toThrow(InternalError)
      try {
        container.register(token, () => 'second')
      } catch (e) {
        expect(e).toBeInstanceOf(InternalError)
        expect((e as InternalError).message).toContain('ya registrado')
      }
    })
  })

  describe('isRegistered', () => {
    it('retorna true para tokens registrados', () => {
      const container = new ContainerImpl()
      const token = new ServiceToken<string>('Registered')
      container.register(token, () => 'value')

      expect(container.isRegistered(token)).toBe(true)
    })

    it('retorna false para tokens no registrados', () => {
      const container = new ContainerImpl()
      const token = new ServiceToken<string>('NotRegistered')

      expect(container.isRegistered(token)).toBe(false)
    })
  })

  describe('lazy instantiation', () => {
    it('factory NO se ejecuta al registrar, solo al resolver', () => {
      const container = new ContainerImpl()
      let factoryCalled = false
      const token = new ServiceToken<string>('Lazy')
      container.register(token, () => {
        factoryCalled = true
        return 'lazy value'
      })

      expect(factoryCalled).toBe(false)
      container.resolve(token)
      expect(factoryCalled).toBe(true)
    })

    it('factory de singleton solo se ejecuta una vez', () => {
      const container = new ContainerImpl()
      let callCount = 0
      const token = new ServiceToken<string>('SingleCall')
      container.register(token, () => {
        callCount++
        return 'value'
      })

      container.resolve(token)
      container.resolve(token)
      container.resolve(token)
      expect(callCount).toBe(1)
    })
  })
})
