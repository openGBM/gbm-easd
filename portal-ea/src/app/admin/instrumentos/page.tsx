'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { InstrumentWithVersion } from '@/types/database'
import Link from 'next/link'

export default function InstrumentosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [instruments, setInstruments] = useState<(InstrumentWithVersion & { session_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newAiPrompt, setNewAiPrompt] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }
    loadInstruments()
  }

  async function loadInstruments() {
    const { data } = await supabase
      .from('instruments')
      .select('*, instrument_versions(*)')
      .order('created_at', { ascending: false })

    if (data) {
      // Para cada instrumento, contar sesiones asociadas
      const formatted = await Promise.all(data.map(async (inst) => {
        const currentVersion = inst.instrument_versions?.find((v: any) => v.is_current) || undefined
        const versionIds = (inst.instrument_versions || []).map((v: any) => v.id)

        let sessionCount = 0
        if (versionIds.length > 0) {
          const { count } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .in('instrument_version_id', versionIds)
          sessionCount = count || 0
        }

        return {
          ...inst,
          current_version: currentVersion,
          session_count: sessionCount,
        }
      }))
      setInstruments(formatted)
    }
    setLoading(false)
  }

  async function createInstrument(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return

    setCreating(true)

    // Crear instrumento
    const { data: inst, error } = await supabase
      .from('instruments')
      .insert({
        name: newName.trim(),
        description: newDescription.trim() || null,
        ai_expertise_prompt: newAiPrompt.trim() || null,
      })
      .select('id')
      .single()

    if (!error && inst) {
      // Crear versión 1
      await supabase
        .from('instrument_versions')
        .insert({
          instrument_id: inst.id,
          version_number: 1,
          version_tag: '1',
          is_current: true,
        })

      setNewName('')
      setNewDescription('')
      setNewAiPrompt('')
      await loadInstruments()
    }
    setCreating(false)
  }

  async function toggleInstrument(id: string, isActive: boolean) {
    await supabase
      .from('instruments')
      .update({ is_active: !isActive })
      .eq('id', id)
    await loadInstruments()
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Cargando...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Instrumentos de Evaluación</h1>
        <Link href="/admin" className="text-blue-600 hover:text-blue-700 text-sm">
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Crear nuevo instrumento */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Crear Nuevo Instrumento</h2>
        <form onSubmit={createInstrument} className="space-y-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nombre del instrumento"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <input
            type="text"
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <textarea
            value={newAiPrompt}
            onChange={e => setNewAiPrompt(e.target.value)}
            placeholder="Expertise de la IA para analizar resultados (ej: Eres un consultor experto en transformación digital...)"
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            type="submit"
            disabled={creating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {creating ? 'Creando...' : '+ Crear Instrumento'}
          </button>
        </form>
      </div>

      {/* Lista de instrumentos */}
      {instruments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No hay instrumentos creados.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {instruments.map(inst => (
            <div key={inst.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{inst.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      inst.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {inst.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    {inst.current_version && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                        v{inst.current_version.version_tag}
                      </span>
                    )}
                  </div>
                  {inst.description && (
                    <p className="text-sm text-gray-500 mb-2">{inst.description}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {inst.session_count} sesión(es) · Creado: {new Date(inst.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/instrumentos/${inst.id}`}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Gestionar
                  </Link>
                  <button
                    onClick={() => toggleInstrument(inst.id, inst.is_active)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      inst.is_active
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {inst.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
