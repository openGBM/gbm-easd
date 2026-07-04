import { NextRequest, NextResponse } from 'next/server'
import { getServerContainer } from '@/core/server-container'
import { TOKENS } from '@/core/types/tokens'
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
    const container = getServerContainer()
    const sessionRepo = container.resolve(TOKENS.SessionRepository)
    const respondentRepo = container.resolve(TOKENS.RespondentRepository)

    // Verificar que la sesión existe y está activa
    const sessionResult = await sessionRepo.findById(sessionId)
    if (!isOk(sessionResult)) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    if (!sessionResult.value.isActive) {
      return NextResponse.json({ error: 'La sesión no está activa' }, { status: 403 })
    }

    // Verificar si ya existe un encuestado con ese email en esta sesión
    const existingResult = await respondentRepo.findByEmail(sessionId, email)
    if (isOk(existingResult) && existingResult.value) {
      const existing = existingResult.value
      if (existing.completed) {
        return NextResponse.json(
          { error: 'Ya respondiste esta encuesta.', code: 'ALREADY_COMPLETED' },
          { status: 409 }
        )
      }
      // Permitir reanudar — retornar el ID existente
      return NextResponse.json({ id: existing.id, resumed: true })
    }

    // Intentar crear nuevo encuestado
    const createResult = await respondentRepo.create({ sessionId, name, email })
    if (!isOk(createResult)) {
      const error = createResult.error
      return NextResponse.json(
        { error: error.message },
        { status: error.httpStatus }
      )
    }

    return NextResponse.json({ id: createResult.value.id, resumed: false })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
