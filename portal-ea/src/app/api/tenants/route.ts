import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const CreateTenantSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).optional(),
  max_active_sessions: z.number().int().min(1).default(10),
  max_analyses_per_month: z.number().int().min(1).default(50),
})

// GET /api/tenants — listar tenants
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const adminClient = createAdminSupabaseClient()
  if (!adminClient) return NextResponse.json({ error: 'Config error' }, { status: 503 })

  // Verificar que es super_admin
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Solo super admin puede gestionar tenants' }, { status: 403 })
  }

  const { data: tenants } = await adminClient
    .from('tenants')
    .select('*')
    .order('name')

  // Cargar stats de uso por tenant
  const tenantIds = (tenants || []).map(t => t.id)
  let stats: Record<string, { users: number; sessions: number; analyses_this_month: number }> = {}

  if (tenantIds.length > 0) {
    // Usuarios por tenant
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('tenant_id')
      .in('tenant_id', tenantIds)
      .eq('is_active', true)

    // Sesiones activas por tenant
    const { data: sessions } = await adminClient
      .from('sessions')
      .select('tenant_id')
      .in('tenant_id', tenantIds)
      .eq('is_active', true)

    // Análisis este mes por tenant
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const { data: analyses } = await adminClient
      .from('usage_logs')
      .select('tenant_id')
      .in('tenant_id', tenantIds)
      .eq('action', 'analysis')
      .gte('created_at', startOfMonth.toISOString())

    // Agregar por tenant
    tenantIds.forEach(tid => {
      stats[tid] = {
        users: (profiles || []).filter(p => p.tenant_id === tid).length,
        sessions: (sessions || []).filter(s => s.tenant_id === tid).length,
        analyses_this_month: (analyses || []).filter(a => a.tenant_id === tid).length,
      }
    })
  }

  const tenantsWithStats = (tenants || []).map(t => ({
    ...t,
    stats: stats[t.id] || { users: 0, sessions: 0, analyses_this_month: 0 },
  }))

  return NextResponse.json({ tenants: tenantsWithStats })
}

// POST /api/tenants — crear tenant
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const adminClient = createAdminSupabaseClient()
  if (!adminClient) return NextResponse.json({ error: 'Config error' }, { status: 503 })

  // Verificar super_admin
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Solo super admin puede crear tenants' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parseResult = CreateTenantSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parseResult.error.flatten().fieldErrors }, { status: 400 })
    }

    const { name, description, max_active_sessions, max_analyses_per_month } = parseResult.data

    const { data: tenant, error } = await adminClient
      .from('tenants')
      .insert({ name, description: description || null, max_active_sessions, max_analyses_per_month })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ tenant }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
