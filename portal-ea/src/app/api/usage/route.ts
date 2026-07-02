import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

/**
 * GET /api/usage?tenant_id=xxx (opcional, solo super_admin)
 * 
 * - Super admin: ve todo o filtra por tenant_id
 * - Admin de área: ve solo consumo de su tenant
 * - Editor: ve solo su propio consumo
 * - Legacy (ADMIN_EMAILS): ve todo (retrocompatibilidad)
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const adminClient = createAdminSupabaseClient()
  if (!adminClient) return NextResponse.json({ error: 'Config error' }, { status: 503 })

  // Obtener perfil del usuario
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  // Fallback legacy: ADMIN_EMAILS
  const allowedAdmins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
  const isLegacyAdmin = allowedAdmins.includes(user.email || '')

  if (!profile && !isLegacyAdmin) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const role = profile?.role || (isLegacyAdmin ? 'super_admin' : null)
  if (!role) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  // Determinar filtro de tenant
  let filterTenantId: string | null = null
  const requestedTenantId = request.nextUrl.searchParams.get('tenant_id')

  if (role === 'super_admin') {
    // Super admin puede ver todo o filtrar por tenant específico
    filterTenantId = requestedTenantId || null
  } else if (role === 'admin') {
    // Admin de área solo ve su tenant
    filterTenantId = profile?.tenant_id || null
  } else if (role === 'editor') {
    // Editor solo ve su propio consumo (filtramos por email más abajo)
    filterTenantId = profile?.tenant_id || null
  }

  // Query de usage_logs
  let query = adminClient
    .from('usage_logs')
    .select('user_email, action, model, input_tokens, output_tokens, created_at, tenant_id')
    .order('created_at', { ascending: false })
    .limit(500)

  if (filterTenantId) {
    query = query.eq('tenant_id', filterTenantId)
  }

  // Editor: solo su propio email
  if (role === 'editor') {
    query = query.eq('user_email', user.email!)
  }

  const { data: logs } = await query

  if (!logs) {
    return NextResponse.json({ summary: [], details: [], role, tenantId: filterTenantId })
  }

  // Agregar resúmenes por usuario
  const userSummary: Record<string, {
    email: string
    sessions_created: number
    analyses_generated: number
    tokens_by_model: Record<string, { input: number; output: number; count: number }>
  }> = {}

  logs.forEach(log => {
    if (!userSummary[log.user_email]) {
      userSummary[log.user_email] = {
        email: log.user_email,
        sessions_created: 0,
        analyses_generated: 0,
        tokens_by_model: {},
      }
    }
    const entry = userSummary[log.user_email]

    if (log.action === 'create_session') {
      entry.sessions_created++
    } else if (log.action === 'analysis') {
      entry.analyses_generated++
      if (log.model) {
        if (!entry.tokens_by_model[log.model]) {
          entry.tokens_by_model[log.model] = { input: 0, output: 0, count: 0 }
        }
        entry.tokens_by_model[log.model].input += log.input_tokens || 0
        entry.tokens_by_model[log.model].output += log.output_tokens || 0
        entry.tokens_by_model[log.model].count++
      }
    }
  })

  // Cargar lista de tenants para el filtro (solo super_admin)
  let tenants: { id: string; name: string }[] = []
  if (role === 'super_admin') {
    const { data: tenantList } = await adminClient
      .from('tenants')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    tenants = tenantList || []
  }

  return NextResponse.json({
    summary: Object.values(userSummary),
    details: logs,
    role,
    tenantId: filterTenantId,
    tenants,
  })
}
