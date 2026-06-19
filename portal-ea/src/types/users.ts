export type UserRole = 'super_admin' | 'admin' | 'editor'

export interface Tenant {
  id: string
  name: string
  description: string | null
  is_active: boolean
  max_active_sessions: number
  max_analyses_per_month: number
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  tenant_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProfileWithTenant extends Profile {
  tenants?: { name: string } | null
}

export interface TenantWithStats extends Tenant {
  user_count: number
  session_count: number
}
