import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNav from './AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Si no hay usuario autenticado, renderizar sin nav
  // La página de login se renderiza normalmente aquí
  // Las páginas protegidas (dashboard, sesiones) redirigen client-side
  if (!user) {
    return <>{children}</>
  }

  // Verificar que el usuario tiene rol de admin
  const allowedAdmins = (process.env.ADMIN_EMAILS || 'admin@gbm.net').split(',').map(e => e.trim())
  if (!allowedAdmins.includes(user.email || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos de administrador.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav userEmail={user.email || ''} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
