import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

// GET /api/catalog — listar instrumentos públicos y templates
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const adminClient = createAdminSupabaseClient()
  if (!adminClient) return NextResponse.json({ error: 'Config error' }, { status: 503 })

  // Obtener perfil para saber el tenant
  const { data: profile } = await adminClient.from('profiles').select('role, tenant_id').eq('id', user.id).single()

  // Cargar instrumentos visibles:
  // - Templates (visibles para todos)
  // - Públicos (visibles para todos)
  // - Privados del propio tenant (si tiene tenant)
  let query = adminClient
    .from('instruments')
    .select('*, instrument_versions(id, version_tag, is_current), profiles!owner_id(full_name)')
    .eq('is_active', true)
    .order('name')

  if (profile?.role === 'super_admin') {
    // Super admin ve todo
  } else if (profile?.tenant_id) {
    // Ver públicos + templates + privados de su tenant
    // tenant_id viene de la BD (profiles), no del usuario — seguro para interpolar
    const tid = profile.tenant_id.replace(/[^a-f0-9-]/gi, '') // sanitizar UUID
    query = query.or(`visibility.eq.public,visibility.eq.template,tenant_id.eq.${tid}`)
  } else {
    // Sin tenant: solo públicos y templates
    query = query.or('visibility.eq.public,visibility.eq.template')
  }

  const { data: instruments } = await query

  return NextResponse.json({ instruments: instruments || [] })
}
