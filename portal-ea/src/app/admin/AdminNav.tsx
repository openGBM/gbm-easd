'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isMultiInstrumentEnabled } from '@/flags'
import Link from 'next/link'

interface AdminNavProps {
  userEmail: string
  multiInstrument?: boolean
}

export default function AdminNav({ userEmail, multiInstrument }: AdminNavProps) {
  const router = useRouter()
  const supabase = createClient()
  const multiInstrumentEnabled = multiInstrument ?? isMultiInstrumentEnabled()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-3">
            <img src="/logo-gbm.png" alt="GBM" className="h-8" />
            <span className="text-lg font-bold text-gray-900">Panel Admin</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              Sesiones
            </Link>
            {multiInstrumentEnabled && (
              <Link href="/admin/instrumentos" className="text-gray-600 hover:text-gray-900">
                Instrumentos
              </Link>
            )}
            <Link href="/admin/encuestados" className="text-gray-600 hover:text-gray-900">
              Encuestados
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{userEmail}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  )
}
