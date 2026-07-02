import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { checkSessionLimit } from '@/lib/tenant-limits'

/**
 * GET /api/sessions/check-limit
 * Verifica si el usuario actual puede crear más sesiones en su tenant.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const adminClient = createAdminSupabaseClient()
  if (!adminClient) return NextResponse.json({ error: 'Config error' }, { status: 503 })

  // Obtener tenant del usuario
  const { data: profile } = await adminClient
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const tenantId = profile?.tenant_id || null
  const result = await checkSessionLimit(adminClient, tenantId)

  return NextResponse.json(result)
}
