import { NextRequest, NextResponse } from 'next/server'
import { getServerContainer } from '@/core/server-container'
import { TOKENS } from '@/core/types/tokens'
import { isOk } from '@/core/errors/result'
import { z } from 'zod'

const CreateViewerLinkSchema = z.object({
  session_id: z.string().uuid(),
  expires_in_hours: z.number().int().min(1).max(720).default(72), // default 3 días
})

// POST /api/viewer-link — generar enlace firmado para viewer
export async function POST(request: NextRequest) {
  const container = getServerContainer()
  const profileRepo = container.resolve(TOKENS.ProfileRepository)
  const viewerLinkRepo = container.resolve(TOKENS.ViewerLinkRepository)
  const sessionRepo = container.resolve(TOKENS.SessionRepository)

  // Verificar autenticación — usamos el import directo temporalmente hasta Unit 5 (Auth Abstraction)
  const { createServerSupabaseClient } = await import('@/lib/supabase/server')
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Verificar que es al menos admin o editor
  const profileResult = await profileRepo.findById(user.id)
  if (!isOk(profileResult)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const profile = profileResult.value
  if (!['super_admin', 'admin', 'editor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parseResult = CreateViewerLinkSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { session_id, expires_in_hours } = parseResult.data

    // Verificar que la sesión existe
    const sessionResult = await sessionRepo.findById(session_id)
    if (!isOk(sessionResult)) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    // Verificar tenant match (si no es super_admin)
    if (profile.role !== 'super_admin' && sessionResult.value.tenantId !== profile.tenantId) {
      return NextResponse.json({ error: 'No puedes compartir sesiones de otra área' }, { status: 403 })
    }

    // Crear viewer link
    const linkResult = await viewerLinkRepo.create({
      sessionId: session_id,
      expiresInHours: expires_in_hours,
      createdBy: user.id,
    })

    if (!isOk(linkResult)) {
      return NextResponse.json({ error: linkResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ token: linkResult.value.token, expires_at: linkResult.value.expiresAt })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// GET /api/viewer-link?token=xxx — validar token y retornar datos de sesión
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })

  const container = getServerContainer()
  const viewerLinkRepo = container.resolve(TOKENS.ViewerLinkRepository)

  const validResult = await viewerLinkRepo.isValid(token)
  if (!isOk(validResult) || !validResult.value) {
    // Intentar dar mensaje más específico
    const linkResult = await viewerLinkRepo.findByToken(token)
    if (!isOk(linkResult)) {
      return NextResponse.json({ error: 'Enlace no válido' }, { status: 404 })
    }
    const link = linkResult.value
    if (link.isRevoked) {
      return NextResponse.json({ error: 'Enlace revocado' }, { status: 403 })
    }
    if (new Date(link.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Enlace expirado' }, { status: 410 })
    }
    return NextResponse.json({ error: 'Enlace no válido' }, { status: 404 })
  }

  // Token válido — obtener session_id
  const linkResult = await viewerLinkRepo.findByToken(token)
  if (!isOk(linkResult)) {
    return NextResponse.json({ error: 'Enlace no válido' }, { status: 404 })
  }

  return NextResponse.json({ session_id: linkResult.value.sessionId, valid: true })
}
