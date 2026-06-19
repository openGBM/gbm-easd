import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const DuplicateSchema = z.object({
  instrument_id: z.string().uuid(),
  new_name: z.string().min(2).max(200).trim(),
  visibility: z.enum(['public', 'private']).default('private'),
})

// POST /api/catalog/duplicate — duplicar un instrumento/template como propio
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const adminClient = createAdminSupabaseClient()
  if (!adminClient) return NextResponse.json({ error: 'Config error' }, { status: 503 })

  // Verificar perfil — necesita ser al menos admin para crear instrumentos
  const { data: profile } = await adminClient.from('profiles').select('role, tenant_id').eq('id', user.id).single()
  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Solo admins pueden crear instrumentos desde templates' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parseResult = DuplicateSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parseResult.error.flatten().fieldErrors }, { status: 400 })
    }

    const { instrument_id, new_name, visibility } = parseResult.data

    // Verificar que el instrumento fuente existe y es accesible
    const { data: source } = await adminClient
      .from('instruments')
      .select('*, instrument_versions(id, is_current, scale_labels, maturity_levels)')
      .eq('id', instrument_id)
      .single()

    if (!source) return NextResponse.json({ error: 'Instrumento no encontrado' }, { status: 404 })

    // Verificar acceso: debe ser público, template, o del mismo tenant
    if (source.visibility === 'private' && source.tenant_id !== profile.tenant_id && profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'No tienes acceso a este instrumento' }, { status: 403 })
    }

    // Crear nuevo instrumento
    const { data: newInst, error: instError } = await adminClient
      .from('instruments')
      .insert({
        name: new_name,
        description: source.description,
        ai_expertise_prompt: source.ai_expertise_prompt,
        visibility,
        tenant_id: profile.tenant_id,
        owner_id: user.id,
      })
      .select('id')
      .single()

    if (instError || !newInst) {
      return NextResponse.json({ error: instError?.message || 'Error al crear instrumento' }, { status: 500 })
    }

    // Encontrar la versión current del source
    const currentVersion = source.instrument_versions?.find((v: any) => v.is_current)
    if (!currentVersion) {
      return NextResponse.json({ instrument_id: newInst.id, message: 'Instrumento creado sin banco (fuente sin versión)' })
    }

    // Crear versión 1 con los mismos datos
    const { data: newVersion } = await adminClient
      .from('instrument_versions')
      .insert({
        instrument_id: newInst.id,
        version_number: 1,
        version_tag: '1',
        is_current: true,
        notes: `Duplicado desde "${source.name}"`,
        scale_labels: currentVersion.scale_labels,
        maturity_levels: currentVersion.maturity_levels,
      })
      .select('id')
      .single()

    if (!newVersion) {
      return NextResponse.json({ instrument_id: newInst.id, message: 'Instrumento creado sin banco' })
    }

    // Copiar dimensiones y preguntas
    const { data: sourceDims } = await adminClient
      .from('dimensions')
      .select('*, questions(*)')
      .eq('instrument_version_id', currentVersion.id)
      .order('display_order')

    if (sourceDims) {
      for (const dim of sourceDims) {
        const { data: newDim } = await adminClient
          .from('dimensions')
          .insert({
            name: dim.name,
            description: dim.description,
            color: dim.color,
            display_order: dim.display_order,
            instrument_version_id: newVersion.id,
          })
          .select('id')
          .single()

        if (newDim && dim.questions) {
          const questions = (dim.questions as any[]).map(q => ({
            dimension_id: newDim.id,
            text: q.text,
            display_order: q.display_order,
            type: q.type || 'likert',
            contributes_to_score: q.contributes_to_score !== false,
            is_required: q.is_required !== false,
          }))
          if (questions.length > 0) {
            await adminClient.from('questions').insert(questions)
          }
        }
      }
    }

    return NextResponse.json({ instrument_id: newInst.id, message: 'Instrumento duplicado exitosamente' }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
