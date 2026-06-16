import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isMultiInstrumentEnabled } from '@/flags'
import AdminNav from './AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Si no hay usuario autenticado, renderizar sin nav.
  // La página de login se renderiza aquí sin el layout de admin.
  // Las páginas protegidas (client components) hacen redirect client-side como doble capa.
  if (!user) {
    return <>{children}</>
  }

  // Verificar que el usuario tiene rol de admin (server-side enforcement)
  const allowedAdmins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
  if (allowedAdmins.length === 0 || !allowedAdmins.includes(user.email || '')) {
    redirect('/admin/login')
  }

  // Evaluar feature flag multi-instrumento
  const isMultiInstrument = isMultiInstrumentEnabled()

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav userEmail={user.email || ''} multiInstrument={isMultiInstrument} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {children}
      </main>
    </div>
  )
}
