'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/Toast'
import Link from 'next/link'

interface CatalogInstrument {
  id: string
  name: string
  description: string | null
  visibility: string
  created_at: string
  profiles?: { full_name: string } | null
  instrument_versions?: { id: string; version_tag: string; is_current: boolean }[]
}

export default function CatalogoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [instruments, setInstruments] = useState<CatalogInstrument[]>([])
  const [loading, setLoading] = useState(true)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'template' | 'public'>('all')

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  async function checkAuthAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/admin/login'); return }
    await loadCatalog()
  }

  async function loadCatalog() {
    const res = await fetch('/api/catalog')
    if (res.ok) {
      const data = await res.json()
      setInstruments(data.instruments)
    }
    setLoading(false)
  }

  async function duplicateInstrument(id: string, name: string) {
    const newName = prompt(`Nombre para la copia de "${name}":`, `${name} (copia)`)
    if (!newName?.trim()) return

    setDuplicating(id)
    const res = await fetch('/api/catalog/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instrument_id: id, new_name: newName.trim(), visibility: 'private' }),
    })

    if (res.ok) {
      const data = await res.json()
      showToast('success', `Instrumento "${newName.trim()}" creado desde template`)
      router.push(`/admin/instrumentos/${data.instrument_id}`)
    } else {
      const err = await res.json()
      showToast('error', err.error || 'Error al duplicar')
    }
    setDuplicating(null)
  }

  const filtered = instruments.filter(i => {
    if (filter === 'template') return i.visibility === 'template'
    if (filter === 'public') return i.visibility === 'public'
    return true
  })

  const visibilityLabel: Record<string, { text: string; color: string }> = {
    template: { text: 'Template', color: 'bg-purple-100 text-purple-700' },
    public: { text: 'Público', color: 'bg-blue-100 text-blue-700' },
    private: { text: 'Privado', color: 'bg-gray-100 text-gray-700' },
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Cargando catálogo...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📚 Catálogo de Instrumentos</h1>
        <Link href="/admin" className="text-blue-600 hover:text-blue-700 text-sm">← Volver</Link>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Explora instrumentos disponibles. Los templates pueden duplicarse como base para crear tus propios instrumentos.
      </p>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {(['all', 'template', 'public'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'template' ? 'Templates' : 'Públicos'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No hay instrumentos en el catálogo.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(inst => {
            const vis = visibilityLabel[inst.visibility] || visibilityLabel.public
            const currentVersion = inst.instrument_versions?.find(v => v.is_current)
            return (
              <div key={inst.id} className="bg-white rounded-xl shadow-sm border p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{inst.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${vis.color}`}>
                        {vis.text}
                      </span>
                      {currentVersion && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          v{currentVersion.version_tag}
                        </span>
                      )}
                    </div>
                    {inst.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{inst.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {inst.profiles?.full_name ? `Por: ${inst.profiles.full_name}` : ''}
                      {' · '}{new Date(inst.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {inst.visibility === 'template' && (
                      <button
                        onClick={() => duplicateInstrument(inst.id, inst.name)}
                        disabled={duplicating === inst.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                      >
                        {duplicating === inst.id ? 'Creando...' : '📋 Usar como base'}
                      </button>
                    )}
                    {inst.visibility === 'public' && (
                      <button
                        onClick={() => duplicateInstrument(inst.id, inst.name)}
                        disabled={duplicating === inst.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        {duplicating === inst.id ? 'Duplicando...' : 'Duplicar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
