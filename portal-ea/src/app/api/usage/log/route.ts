import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UsageLogSchema = z.object({
  action: z.enum(['create_session', 'analysis']),
  model: z.string().max(100).optional(),
  input_tokens: z.number().int().min(0).default(0),
  output_tokens: z.number().int().min(0).default(0),
  metadata: z.record(z.string(), z.any()).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parseResult = UsageLogSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { action, model, input_tokens, output_tokens, metadata } = parseResult.data

    const { error } = await supabase.from('usage_logs').insert({
      user_email: user.email,
      action,
      model: model || null,
      input_tokens,
      output_tokens,
      metadata: metadata || {},
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
