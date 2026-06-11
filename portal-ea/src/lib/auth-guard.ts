/**
 * Server-side auth guard para rutas admin protegidas.
 * Usar en páginas server-component o importar y llamar al inicio de una página.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Verifica que el usuario esté autenticado y sea admin.
 * Si no, redirige a /admin/login.
 * Retorna el email del usuario si pasa la verificación.
 */
export async function requireAdmin(): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const allowedAdmins = (process.env.ADMIN_EMAILS || 'admin@gbm.net').split(',').map(e => e.trim())
  if (!allowedAdmins.includes(user.email || '')) {
    redirect('/admin/login')
  }

  return user.email || ''
}
