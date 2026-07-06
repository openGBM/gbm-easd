import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { AuthMiddleware } from '../../../ports/auth/auth-middleware'

/**
 * SupabaseAuthMiddleware — Protege rutas /admin/* usando Supabase Auth.
 *
 * Refresca la sesión y verifica que el usuario tenga perfil activo o esté
 * en la lista de ADMIN_EMAILS (fallback legacy).
 */
export class SupabaseAuthMiddleware implements AuthMiddleware {
  async protect(request: NextRequest): Promise<NextResponse> {
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
      },
    )

    // Refrescar sesión
    const { data: { user } } = await supabase.auth.getUser()

    // Proteger rutas /admin/* (excepto /admin/login)
    if (
      request.nextUrl.pathname.startsWith('/admin') &&
      !request.nextUrl.pathname.startsWith('/admin/login')
    ) {
      if (!user) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      // Verificar perfil activo O admin legacy
      const allowedAdmins = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
      const isLegacyAdmin = allowedAdmins.includes(user.email || '')

      if (!isLegacyAdmin) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', user.id)
          .single()

        if (!profile || !profile.is_active) {
          return NextResponse.redirect(new URL('/admin/login', request.url))
        }
      }
    }

    return response
  }
}
