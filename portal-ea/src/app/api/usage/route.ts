import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const allowedAdmins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
  if (allowedAdmins.length === 0 || !allowedAdmins.includes(user.email || '')) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  // Resumen por usuario
  const { data: byUser } = await supabase
    .from('usage_logs')
    .select('user_email, action, model, input_tokens, output_tokens, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (!byUser) {
    return NextResponse.json({ summary: [], details: [] })
  }

  // Agregar resúmenes
  const userSummary: Record<string, {
    email: string
    sessions_created: number
    analyses_generated: number
    tokens_by_model: Record<string, { input: number; output: number; count: number }>
  }> = {}

  byUser.forEach(log => {
    if (!userSummary[log.user_email]) {
      userSummary[log.user_email] = {
        email: log.user_email,
        sessions_created: 0,
        analyses_generated: 0,
        tokens_by_model: {},
      }
    }
    const entry = userSummary[log.user_email]

    if (log.action === 'create_session') {
      entry.sessions_created++
    } else if (log.action === 'analysis') {
      entry.analyses_generated++
      if (log.model) {
        if (!entry.tokens_by_model[log.model]) {
          entry.tokens_by_model[log.model] = { input: 0, output: 0, count: 0 }
        }
        entry.tokens_by_model[log.model].input += log.input_tokens || 0
        entry.tokens_by_model[log.model].output += log.output_tokens || 0
        entry.tokens_by_model[log.model].count++
      }
    }
  })

  return NextResponse.json({
    summary: Object.values(userSummary),
    details: byUser,
  })
}
