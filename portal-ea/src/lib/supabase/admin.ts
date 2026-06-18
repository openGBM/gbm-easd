import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con service_role key.
 * SOLO para uso en API routes server-side.
 * Bypasa RLS — usar con precaución.
 * Retorna null si SUPABASE_SERVICE_ROLE_KEY no está configurada.
 */
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('[admin-client] SUPABASE_SERVICE_ROLE_KEY no configurada')
    return null
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}
