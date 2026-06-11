import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkPublicRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

// Schema de validación para registro de encuestado
const RegisterRespondentSchema = z.object({
  sessionId: z.string().uuid('sessionId debe ser un UUID válido'),
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  email: z.string()
    .email('Formato de correo inválido')
    .max(254, 'Email demasiado largo')
    .trim()
    .toLowerCase(),
})

export async function POST(request: NextRequest) {
  // Rate limiting por IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  const rateLimitResult = await checkPublicRateLimit(ip)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    const body = await request.json()

    // Validar con Zod
    const parseResult = RegisterRespondentSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { sessionId, name, email } = parseResult.data
    const supabase = await createServerSupabaseClient()

    // Verificar que la sesión existe y está activa
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, is_active')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    if (!session.is_active) {
      return NextResponse.json({ error: 'La sesión no está activa' }, { status: 403 })
    }

    // Intentar insertar
    const { data, error: dbError } = await supabase
      .from('respondents')
      .insert({ session_id: sessionId, name, email })
      .select('id')
      .single()

    if (dbError) {
      if (dbError.code === '23505') {
        // Email duplicado — verificar si completó
        const { data: existing } = await supabase
          .from('respondents')
          .select('id, completed')
          .eq('session_id', sessionId)
          .eq('email', email)
          .single()

        if (existing?.completed) {
          return NextResponse.json(
            { error: 'Ya respondiste esta encuesta.', code: 'ALREADY_COMPLETED' },
            { status: 409 }
          )
        }

        if (existing) {
          // Permitir reanudar — retornar el ID existente
          return NextResponse.json({ id: existing.id, resumed: true })
        }

        return NextResponse.json({ error: 'Email ya registrado en esta sesión' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Error al registrar' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, resumed: false })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
