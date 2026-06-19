import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const CreateViewerLinkSchema = z.object({
  session_id: z.string().uuid(),
  expires_in_hours: z.number().int().min(1).max(720).default(72), // default 3 días
})

// POST /api/viewer-link — generar enlace firmado para viewer
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const adminClient = createAdminSupabaseClient()
  if (!adminClient) return NextResponse.json({ error: 'Config error' }, { status: 503 })

  // Verificar que es al menos admin o editor
  const { data: profile } = await adminClient.from('profiles').select('role, tenant_id').eq('id', user.id).single()
  if (!profile || !['super_admin', 'admin', 'editor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parseResult = CreateViewerLinkSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { session_id, expires_in_hours } = parseResult.data

    // Verificar que la sesión existe y pertenece al tenant del usuario
    const { data: session } = await adminClient.from('sessions').select('id, tenant_id').eq('id', session_id).single()
    if (!session) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })

    if (profile.role !== 'super_admin' && session.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'No puedes compartir sesiones de otra área' }, { status: 403 })
    }

    // Generar token firmado (simple: base64 de session_id + expiration + random)
    // Generar token seguro con componente random (no predecible)
    const expiresAt = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString()
    const randomBytes = crypto.randomUUID().replace(/-/g, '')
    const token = `vl_${randomBytes}`

    // Guardar en BD para validación (el token es opaco, la validación es por lookup en BD)
    const { error: insertError } = await adminClient.from('viewer_links').insert({
      token,
      session_id,
      expires_at: expiresAt,
      created_by: user.id,
    })

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    return NextResponse.json({ token, expires_at: expiresAt })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// GET /api/viewer-link?token=xxx — validar token y retornar datos de sesión
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })

  const adminClient = createAdminSupabaseClient()
  if (!adminClient) return NextResponse.json({ error: 'Config error' }, { status: 503 })

  const { data: link } = await adminClient
    .from('viewer_links')
    .select('session_id, expires_at, is_revoked')
    .eq('token', token)
    .single()

  if (!link) return NextResponse.json({ error: 'Enlace no válido' }, { status: 404 })
  if (link.is_revoked) return NextResponse.json({ error: 'Enlace revocado' }, { status: 403 })
  if (new Date(link.expires_at) < new Date()) return NextResponse.json({ error: 'Enlace expirado' }, { status: 410 })

  return NextResponse.json({ session_id: link.session_id, valid: true })
}
