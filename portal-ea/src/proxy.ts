import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refrescar sesión (necesario para mantener auth activo)
  const { data: { user } } = await supabase.auth.getUser()

  // Proteger rutas /admin/* (excepto /admin/login)
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Verificar que el usuario tiene perfil activo O está en ADMIN_EMAILS (fallback legacy)
    const allowedAdmins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
    const isLegacyAdmin = allowedAdmins.includes(user.email || '')

    if (!isLegacyAdmin) {
      // Verificar en tabla profiles
      const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single()

      if (!profile || !profile.is_active) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      // Cualquier rol activo (super_admin, admin, editor) puede acceder al panel
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
