'use client'

import { useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const links = [
    { href: '/admin', label: 'Sesiones' },
    ...(multiInstrumentEnabled ? [{ href: '/admin/instrumentos', label: 'Instrumentos' }] : []),
    { href: '/admin/catalogo', label: 'Catálogo' },
    { href: '/admin/encuestados', label: 'Encuestados' },
    { href: '/admin/consumo', label: 'Consumo' },
    { href: '/admin/usuarios', label: 'Usuarios' },
    { href: '/admin/tenants', label: 'Áreas' },
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/logo-gbm.png" alt="GBM" className="h-7 sm:h-8" />
            <span className="text-base sm:text-lg font-bold text-gray-900 hidden sm:inline">Panel Admin</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs text-gray-500 hidden md:inline">{userEmail}</span>
            {/* Hamburger para mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-1 text-gray-600 hover:text-gray-900"
              aria-label="Menú de navegación"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Desktop: horizontal scrollable */}
        <div className="hidden sm:flex items-center gap-4 mt-2 text-sm overflow-x-auto pb-1">
          {links.map(link => (
            <Link key={link.href} href={link.href} className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile: dropdown */}
        {menuOpen && (
          <div className="sm:hidden mt-2 py-2 border-t border-gray-100 grid grid-cols-2 gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
