import { describe, it, expect } from 'vitest'

type Visibility = 'public' | 'private' | 'template'
type Role = 'super_admin' | 'admin' | 'editor'

interface Instrument {
  id: string
  visibility: Visibility
  tenant_id: string | null
}

/**
 * Determina si un usuario puede ver un instrumento en el catálogo.
 */
function canViewInstrument(instrument: Instrument, userRole: Role, userTenantId: string | null): boolean {
  // Super admin ve todo
  if (userRole === 'super_admin') return true
  // Templates y públicos son visibles para todos
  if (instrument.visibility === 'template' || instrument.visibility === 'public') return true
  // Privados: solo si es del mismo tenant
  if (instrument.visibility === 'private' && instrument.tenant_id === userTenantId) return true
  return false
}

/**
 * Determina si un usuario puede duplicar un instrumento.
 */
function canDuplicate(instrument: Instrument, userRole: Role, userTenantId: string | null): boolean {
  // Solo admin y super_admin pueden duplicar
  if (userRole === 'editor') return false
  // Debe poder verlo primero
  return canViewInstrument(instrument, userRole, userTenantId)
}

/**
 * Determina si un usuario puede gestionar (editar/eliminar) un instrumento.
 */
function canManageInstrument(instrument: Instrument, userRole: Role, userId: string, ownerId: string | null): boolean {
  if (userRole === 'super_admin') return true
  if (ownerId === userId) return true
  return false
}

describe('Catalog visibility rules', () => {
  const publicInst: Instrument = { id: '1', visibility: 'public', tenant_id: 'tenant-a' }
  const privateInst: Instrument = { id: '2', visibility: 'private', tenant_id: 'tenant-a' }
  const templateInst: Instrument = { id: '3', visibility: 'template', tenant_id: null }
  const otherPrivate: Instrument = { id: '4', visibility: 'private', tenant_id: 'tenant-b' }

  describe('canViewInstrument', () => {
    it('super_admin ve todo', () => {
      expect(canViewInstrument(publicInst, 'super_admin', null)).toBe(true)
      expect(canViewInstrument(privateInst, 'super_admin', null)).toBe(true)
      expect(canViewInstrument(templateInst, 'super_admin', null)).toBe(true)
      expect(canViewInstrument(otherPrivate, 'super_admin', null)).toBe(true)
    })

    it('admin ve públicos, templates y privados de su tenant', () => {
      expect(canViewInstrument(publicInst, 'admin', 'tenant-a')).toBe(true)
      expect(canViewInstrument(templateInst, 'admin', 'tenant-a')).toBe(true)
      expect(canViewInstrument(privateInst, 'admin', 'tenant-a')).toBe(true)
      expect(canViewInstrument(otherPrivate, 'admin', 'tenant-a')).toBe(false)
    })

    it('editor ve públicos, templates y privados de su tenant', () => {
      expect(canViewInstrument(publicInst, 'editor', 'tenant-a')).toBe(true)
      expect(canViewInstrument(templateInst, 'editor', 'tenant-a')).toBe(true)
      expect(canViewInstrument(privateInst, 'editor', 'tenant-a')).toBe(true)
      expect(canViewInstrument(otherPrivate, 'editor', 'tenant-a')).toBe(false)
    })
  })

  describe('canDuplicate', () => {
    it('editor no puede duplicar', () => {
      expect(canDuplicate(templateInst, 'editor', 'tenant-a')).toBe(false)
    })

    it('admin puede duplicar público y template', () => {
      expect(canDuplicate(publicInst, 'admin', 'tenant-a')).toBe(true)
      expect(canDuplicate(templateInst, 'admin', 'tenant-a')).toBe(true)
    })

    it('admin no puede duplicar privado de otro tenant', () => {
      expect(canDuplicate(otherPrivate, 'admin', 'tenant-a')).toBe(false)
    })
  })

  describe('canManageInstrument', () => {
    it('super_admin gestiona todo', () => {
      expect(canManageInstrument(publicInst, 'super_admin', 'user-x', 'user-y')).toBe(true)
    })

    it('owner gestiona su instrumento', () => {
      expect(canManageInstrument(publicInst, 'admin', 'user-a', 'user-a')).toBe(true)
    })

    it('no-owner no gestiona', () => {
      expect(canManageInstrument(publicInst, 'admin', 'user-a', 'user-b')).toBe(false)
    })
  })
})
