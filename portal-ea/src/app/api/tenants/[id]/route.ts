import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const UpdateTenantSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
  max_active_sessions: z.number().int().min(1).optional(),
  max_analyses_per_month: z.number().int().min(1).optional(),
})

// PATCH /api/tenants/[id] — actualizar tenant
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const adminClient = createAdminSupabaseClient()
  if (!adminClient) return NextResponse.json({ error: 'Config error' }, { status: 503 })

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Solo super admin puede gestionar áreas' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parseResult = UpdateTenantSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { data: updated, error } = await adminClient
      .from('tenants')
      .update(parseResult.data)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ tenant: updated })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
