import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const CreateUserSchema = z.object({
  email: z.string().email().max(254).trim().toLowerCase(),
  full_name: z.string().min(2).max(100).trim(),
  password: z.string().min(8).max(128),
  role: z.enum(['admin', 'editor']),
  tenant_id: z.string().uuid(),
})

// GET /api/users — listar usuarios
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const adminClient = createAdminSupabaseClient()
  if (!adminClient) return NextResponse.json({ error: 'Config error' }, { status: 503 })

  // Obtener perfil del solicitante
  const { data: requester } = await adminClient.from('profiles').select('role, tenant_id').eq('id', user.id).single()
  if (!requester) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })

  let query = adminClient.from('profiles').select('*, tenants(name)').order('full_name')

  // Super admin ve todos; admin de área ve solo su tenant
  if (requester.role === 'admin') {
    query = query.eq('tenant_id', requester.tenant_id!)
  } else if (requester.role !== 'super_admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { data: users } = await query
  return NextResponse.json({ users: users || [] })
}

// POST /api/users — crear usuario
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const adminClient = createAdminSupabaseClient()
  if (!adminClient) return NextResponse.json({ error: 'Config error' }, { status: 503 })

  // Obtener perfil del solicitante
  const { data: requester } = await adminClient.from('profiles').select('role, tenant_id').eq('id', user.id).single()
  if (!requester) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })

  try {
    const body = await request.json()
    const parseResult = CreateUserSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parseResult.error.flatten().fieldErrors }, { status: 400 })
    }

    const { email, full_name, password, role, tenant_id } = parseResult.data

    // Validar permisos de creación
    if (role === 'admin' && requester.role !== 'super_admin') {
      return NextResponse.json({ error: 'Solo super admin puede crear admins de área' }, { status: 403 })
    }
    if (requester.role === 'admin' && tenant_id !== requester.tenant_id) {
      return NextResponse.json({ error: 'Solo puedes crear usuarios en tu área' }, { status: 403 })
    }
    if (requester.role !== 'super_admin' && requester.role !== 'admin') {
      return NextResponse.json({ error: 'Sin permisos para crear usuarios' }, { status: 403 })
    }

    // Verificar que el tenant existe y está activo
    const { data: tenant } = await adminClient.from('tenants').select('id, is_active').eq('id', tenant_id).single()
    if (!tenant) return NextResponse.json({ error: 'Área no encontrada' }, { status: 404 })
    if (!tenant.is_active) return NextResponse.json({ error: 'Área desactivada' }, { status: 400 })

    // Crear usuario en Supabase Auth
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Crear perfil
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        role,
        tenant_id,
      })
      .select()
      .single()

    if (profileError) {
      // Rollback: eliminar auth user
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ user: profile }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error interno' }, { status: 500 })
  }
}
