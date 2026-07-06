/**
 * Supabase Client Factory — centraliza la creación de clientes Supabase.
 * Este es el ÚNICO lugar donde se importan las dependencias de @supabase/*.
 *
 * NOTA: createServerSupabaseClient usa dynamic import de 'next/headers'
 * para evitar que se bundlee en client components.
 */
import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Crea un cliente Supabase para uso en el browser (client components).
 * Usa anon key — RLS activo.
 */
export function createBrowserSupabaseClient(): SupabaseClient {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

/**
 * Crea un cliente Supabase para uso server-side (server components, API routes).
 * Usa anon key con cookie-based auth — RLS activo con contexto de usuario.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Component — no se pueden setear cookies
          }
        },
      },
    },
  )
}

/**
 * Crea un cliente Supabase con service_role key.
 * Bypasa RLS — SOLO para uso en API routes server-side.
 * Retorna null si SUPABASE_SERVICE_ROLE_KEY no está configurada.
 */
export function createAdminSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return null
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
  })
}
