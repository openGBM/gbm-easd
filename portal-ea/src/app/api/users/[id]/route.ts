import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const UpdateUserSchema = z.object({
  is_active: z.boolean().optional(),
  role: z.enum(['admin', 'editor']).optional(),
  full_name: z.string().min(2).max(100).trim().optional(),
})

// PATCH /api/users/[id] — actualizar usuario
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const adminClient = createAdminSupabaseClient()
  if (!adminClient) return NextResponse.json({ error: 'Config error' }, { status: 503 })

  // Obtener perfil del solicitante
  const { data: requester } = await adminClient.from('profiles').select('role, tenant_id').eq('id', user.id).single()
  if (!requester) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })

  // Obtener perfil del target
  const { data: target } = await adminClient.from('profiles').select('role, tenant_id').eq('id', id).single()
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  // Validar permisos
  if (requester.role === 'admin') {
    // Admin de área solo puede gestionar usuarios de su tenant (no otros admins)
    if (target.tenant_id !== requester.tenant_id) {
      return NextResponse.json({ error: 'No puedes gestionar usuarios de otra área' }, { status: 403 })
    }
    if (target.role === 'admin' || target.role === 'super_admin') {
      return NextResponse.json({ error: 'No puedes modificar admins' }, { status: 403 })
    }
  } else if (requester.role !== 'super_admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // No permitir desactivarse a sí mismo
  if (id === user.id) {
    return NextResponse.json({ error: 'No puedes modificar tu propia cuenta' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const parseResult = UpdateUserSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (parseResult.data.is_active !== undefined) updates.is_active = parseResult.data.is_active
    if (parseResult.data.role !== undefined) {
      // Solo super_admin puede cambiar roles a admin
      if (parseResult.data.role === 'admin' && requester.role !== 'super_admin') {
        return NextResponse.json({ error: 'Solo super admin puede asignar rol admin' }, { status: 403 })
      }
      updates.role = parseResult.data.role
    }
    if (parseResult.data.full_name) updates.full_name = parseResult.data.full_name

    const { data: updated, error } = await adminClient
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ user: updated })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
