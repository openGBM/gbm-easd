import { SupabaseClient } from '@supabase/supabase-js'

interface TenantLimitResult {
  allowed: boolean
  current: number
  limit: number
  message?: string
}

/**
 * Verifica si el tenant puede crear más sesiones activas.
 * Retorna allowed=true si no hay tenant (legacy) o si no excede el límite.
 */
export async function checkSessionLimit(
  adminClient: SupabaseClient,
  tenantId: string | null
): Promise<TenantLimitResult> {
  if (!tenantId) return { allowed: true, current: 0, limit: Infinity }

  // Obtener límite del tenant
  const { data: tenant } = await adminClient
    .from('tenants')
    .select('max_active_sessions, is_active')
    .eq('id', tenantId)
    .single()

  if (!tenant) return { allowed: true, current: 0, limit: Infinity }
  if (!tenant.is_active) {
    return { allowed: false, current: 0, limit: 0, message: 'Tu área está desactivada. Contacta al administrador.' }
  }

  // Contar sesiones activas del tenant
  const { count } = await adminClient
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_active', true)

  const current = count || 0
  const limit = tenant.max_active_sessions

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      message: `Límite de sesiones activas alcanzado (${current}/${limit}). Desactiva sesiones existentes o contacta al administrador.`,
    }
  }

  return { allowed: true, current, limit }
}

/**
 * Verifica si el tenant puede generar más análisis IA este mes.
 * Retorna allowed=true si no hay tenant (legacy) o si no excede el límite.
 */
export async function checkAnalysisLimit(
  adminClient: SupabaseClient,
  tenantId: string | null
): Promise<TenantLimitResult> {
  if (!tenantId) return { allowed: true, current: 0, limit: Infinity }

  // Obtener límite del tenant
  const { data: tenant } = await adminClient
    .from('tenants')
    .select('max_analyses_per_month, is_active')
    .eq('id', tenantId)
    .single()

  if (!tenant) return { allowed: true, current: 0, limit: Infinity }
  if (!tenant.is_active) {
    return { allowed: false, current: 0, limit: 0, message: 'Tu área está desactivada. Contacta al administrador.' }
  }

  // Contar análisis generados este mes por el tenant
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await adminClient
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('action', 'analysis')
    .gte('created_at', startOfMonth.toISOString())

  const current = count || 0
  const limit = tenant.max_analyses_per_month

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      message: `Límite de análisis IA alcanzado este mes (${current}/${limit}). Contacta al administrador para aumentar el límite.`,
    }
  }

  return { allowed: true, current, limit }
}
