import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con service_role key.
 * SOLO para uso en API routes server-side.
 * Bypasa RLS — usar con precaución.
 */
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}
