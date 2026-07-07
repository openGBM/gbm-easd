import { NextRequest, NextResponse } from 'next/server'
import { getServerContainer } from '@/core/server-container'
import { createRespondentService } from '@/core/services/factories'
import { isOk } from '@/core/errors/result'
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

    // Usar RespondentService para toda la lógica de registro/reanudación
    const respondentService = createRespondentService(getServerContainer())
    const result = await respondentService.registerOrResume({ sessionId, name, email })

    if (!isOk(result)) {
      const error = result.error
      // Manejar el caso especial de ALREADY_COMPLETED para compatibilidad con el frontend
      if (error.code === 'CONFLICT' && error.context?.code === 'ALREADY_COMPLETED') {
        return NextResponse.json(
          { error: error.message, code: 'ALREADY_COMPLETED' },
          { status: error.httpStatus }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.httpStatus }
      )
    }

    return NextResponse.json({
      id: result.value.respondentId,
      resumed: result.value.resumed,
    })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
