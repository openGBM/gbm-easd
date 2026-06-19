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

  return NextResponse.json({ tenants: tenants || [] })
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
