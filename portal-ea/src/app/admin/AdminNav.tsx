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
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/logo-gbm.png" alt="GBM" className="h-7 sm:h-8" />
            <span className="text-base sm:text-lg font-bold text-gray-900 hidden sm:inline">Panel Admin</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-500 hidden md:inline">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Salir
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 mt-2 text-sm overflow-x-auto">
          <Link href="/admin" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
            Sesiones
          </Link>
          {multiInstrumentEnabled && (
            <Link href="/admin/instrumentos" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
              Instrumentos
            </Link>
          )}
          <Link href="/admin/encuestados" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
            Encuestados
          </Link>
          <Link href="/admin/consumo" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
            Consumo
          </Link>
          <Link href="/admin/usuarios" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
            Usuarios
          </Link>
          <Link href="/admin/tenants" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
            Áreas
          </Link>
        </div>
      </div>
    </nav>
  )
}
