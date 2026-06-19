import { describe, it, expect } from 'vitest'
import type { UserRole, Tenant, Profile, ProfileWithTenant } from './users'

describe('User types validation', () => {
  it('UserRole only allows valid values', () => {
    const validRoles: UserRole[] = ['super_admin', 'admin', 'editor']
    expect(validRoles).toHaveLength(3)
    validRoles.forEach(role => {
      expect(['super_admin', 'admin', 'editor']).toContain(role)
    })
  })

  it('Tenant interface has required fields', () => {
    const tenant: Tenant = {
      id: '123',
      name: 'Human Capital',
      description: 'Equipo de HC',
      is_active: true,
      max_active_sessions: 10,
      max_analyses_per_month: 50,
      created_at: '2026-01-01T00:00:00Z',
    }
    expect(tenant.name).toBe('Human Capital')
    expect(tenant.is_active).toBe(true)
    expect(tenant.max_active_sessions).toBe(10)
  })

  it('Profile interface has required fields', () => {
    const profile: Profile = {
      id: 'user-123',
      email: 'test@gbm.net',
      full_name: 'Test User',
      role: 'editor',
      tenant_id: 'tenant-123',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    expect(profile.role).toBe('editor')
    expect(profile.tenant_id).toBe('tenant-123')
  })

  it('ProfileWithTenant can have tenant info', () => {
    const profile: ProfileWithTenant = {
      id: 'user-123',
      email: 'test@gbm.net',
      full_name: 'Test User',
      role: 'admin',
      tenant_id: 'tenant-123',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      tenants: { name: 'Arquitectura' },
    }
    expect(profile.tenants?.name).toBe('Arquitectura')
  })

  it('super_admin can have null tenant_id', () => {
    const profile: Profile = {
      id: 'sa-123',
      email: 'superadmin@gbm.net',
      full_name: 'Super Admin',
      role: 'super_admin',
      tenant_id: null,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    expect(profile.tenant_id).toBeNull()
    expect(profile.role).toBe('super_admin')
  })
})
