import { describe, it, expect } from 'vitest'
import { hasMinRole } from './get-current-profile'

describe('hasMinRole', () => {
  it('super_admin tiene acceso a todo', () => {
    expect(hasMinRole('super_admin', 'editor')).toBe(true)
    expect(hasMinRole('super_admin', 'admin')).toBe(true)
    expect(hasMinRole('super_admin', 'super_admin')).toBe(true)
  })

  it('admin tiene acceso a admin y editor', () => {
    expect(hasMinRole('admin', 'editor')).toBe(true)
    expect(hasMinRole('admin', 'admin')).toBe(true)
    expect(hasMinRole('admin', 'super_admin')).toBe(false)
  })

  it('editor solo tiene acceso a editor', () => {
    expect(hasMinRole('editor', 'editor')).toBe(true)
    expect(hasMinRole('editor', 'admin')).toBe(false)
    expect(hasMinRole('editor', 'super_admin')).toBe(false)
  })

  it('rol desconocido no tiene acceso a nada', () => {
    expect(hasMinRole('viewer', 'editor')).toBe(false)
    expect(hasMinRole('', 'editor')).toBe(false)
  })
})
