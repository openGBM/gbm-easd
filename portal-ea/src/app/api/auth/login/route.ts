import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkPublicRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email().max(254).trim().toLowerCase(),
  password: z.string().min(1).max(128),
})

export async function POST(request: NextRequest) {
  // Rate limiting por IP (5 intentos por minuto)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  const rateLimitResult = await checkPublicRateLimit(`login:${ip}`)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un minuto antes de volver a intentar.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    const body = await request.json()
    const parseResult = LoginSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { email, password } = parseResult.data
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    return NextResponse.json({ user: { email: data.user.email } })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
