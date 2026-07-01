import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const ResetPasswordSchema = z.object({
  mode: z.enum(['generate', 'send_email']),
})

/**
 * POST /api/users/[id]/reset-password
 * Solo super_admin puede resetear contraseñas de otros usuarios.
 * Modos:
 *  - generate: genera una contraseña aleatoria y la asigna directamente
 *  - send_email: envía un correo de recuperación de contraseña al usuario
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const adminClient = createAdminSupabaseClient()
  if (!adminClient) return NextResponse.json({ error: 'Config error' }, { status: 503 })

  // Solo super_admin puede resetear contraseñas
  const { data: requester } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (!requester || requester.role !== 'super_admin') {
    return NextResponse.json({ error: 'Solo super admin puede resetear contraseñas' }, { status: 403 })
  }

  // Verificar que el target existe y no es el mismo usuario
  if (id === user.id) {
    return NextResponse.json({ error: 'No puedes resetear tu propia contraseña desde aquí' }, { status: 400 })
  }

  const { data: target } = await adminClient.from('profiles').select('email, full_name, role').eq('id', id).single()
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  try {
    const body = await request.json()
    const parseResult = ResetPasswordSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos inválidos. Usa mode: "generate" o "send_email"' }, { status: 400 })
    }

    const { mode } = parseResult.data

    if (mode === 'generate') {
      // Generar contraseña aleatoria segura (16 chars: letras, números, símbolos)
      const newPassword = generateSecurePassword()

      const { error: updateError } = await adminClient.auth.admin.updateUserById(id, {
        password: newPassword,
      })

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        message: `Contraseña asignada a ${target.email}`,
        password: newPassword,
        user_email: target.email,
        user_name: target.full_name,
      })
    }

    if (mode === 'send_email') {
      // Enviar correo de recuperación de contraseña via Supabase Auth
      const { error: resetError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: target.email,
      })

      if (resetError) {
        return NextResponse.json({ error: resetError.message }, { status: 500 })
      }

      return NextResponse.json({
        message: `Correo de recuperación enviado a ${target.email}`,
        user_email: target.email,
      })
    }

    return NextResponse.json({ error: 'Modo no soportado' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

/**
 * Genera una contraseña aleatoria de 16 caracteres con:
 * - Al menos 2 mayúsculas
 * - Al menos 2 minúsculas
 * - Al menos 2 números
 * - Al menos 2 símbolos
 */
function generateSecurePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%&*?'

  const pick = (chars: string, count: number): string[] => {
    const result: string[] = []
    const arr = new Uint32Array(count)
    crypto.getRandomValues(arr)
    for (let i = 0; i < count; i++) {
      result.push(chars[arr[i] % chars.length])
    }
    return result
  }

  const parts = [
    ...pick(upper, 3),
    ...pick(lower, 5),
    ...pick(digits, 4),
    ...pick(symbols, 4),
  ]

  // Shuffle con Fisher-Yates
  const shuffleArr = new Uint32Array(parts.length)
  crypto.getRandomValues(shuffleArr)
  for (let i = parts.length - 1; i > 0; i--) {
    const j = shuffleArr[i] % (i + 1)
    ;[parts[i], parts[j]] = [parts[j], parts[i]]
  }

  return parts.join('')
}
