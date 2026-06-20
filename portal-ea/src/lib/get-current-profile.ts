import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Profile } from '@/types/users'

/**
 * Obtiene el perfil del usuario autenticado actual.
 * Retorna null si no hay usuario autenticado o no tiene perfil.
 * Usado en server components y API routes.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile || null
}

/**
 * Verifica si el usuario actual tiene al menos el rol especificado.
 * Jerarquía: super_admin > admin > editor
 */
export function hasMinRole(userRole: string, requiredRole: string): boolean {
  const hierarchy = ['editor', 'admin', 'super_admin']
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(requiredRole)
}
