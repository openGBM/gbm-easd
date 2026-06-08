'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Session } from '@/types/database'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import Link from 'next/link'

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [sessions, setSessions] = useState<(Session & { respondent_count: number })[]>([])
  const [newSessionName, setNewSessionName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }
    loadSessions()
  }

  async function loadSessions() {
    const { data } = await supabase
      .from('sessions')
      .select('*, respondents(count)')
      .order('created_at', { ascending: false })

    if (data) {
      const formatted = data.map(s => ({
        ...s,
        respondent_count: s.respondents?.[0]?.count || 0,
      }))
      setSessions(formatted)
    }
    setLoading(false)
  }

  async function createSession(e: React.FormEvent) {
    e.preventDefault()
    if (!newSessionName.trim()) return

    setCreating(true)
    const { error } = await supabase
      .from('sessions')
      .insert({ name: newSessionName.trim() })

    if (!error) {
      setNewSessionName('')
      await loadSessions()
    }
    setCreating(false)
  }

  async function toggleSession(id: string, isActive: boolean) {
    await supabase
      .from('sessions')
      .update({ is_active: !isActive })
      .eq('id', id)

    await loadSessions()
  }

  async function deleteSession(id: string, name: string) {
    const confirmed = confirm(
      `¿Eliminar la sesión "${name}" y todos sus encuestados y respuestas?\n\nEsta acción no se puede deshacer.`
    )
    if (!confirmed) return

    setDeleting(id)

    // Obtener respondents de la sesión para eliminar sus respuestas
    const { data: respondents } = await supabase
      .from('respondents')
      .select('id')
      .eq('session_id', id)

    if (respondents && respondents.length > 0) {
      const respondentIds = respondents.map(r => r.id)
      // Eliminar respuestas de todos los encuestados
      await supabase.from('responses').delete().in('respondent_id', respondentIds)
      // Eliminar encuestados
      await supabase.from('respondents').delete().eq('session_id', id)
    }

    // Eliminar la sesión
    await supabase.from('sessions').delete().eq('id', id)

    setDeleting(null)
    await loadSessions()
  }

  function getSurveyUrl(sessionId: string) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/encuesta/${sessionId}`
    }
    return `/encuesta/${sessionId}`
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
        <h1 className="text-2xl font-bold text-gray-900">Sesiones de Evaluación</h1>
      </div>

      {/* Crear nueva sesión */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Crear Nueva Sesión</h2>
        <form onSubmit={createSession} className="flex gap-4">
          <input
            type="text"
            value={newSessionName}
            onChange={e => setNewSessionName(e.target.value)}
            placeholder="Nombre de la sesión (ej: Evaluación Banco XYZ)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 whitespace-nowrap"
          >
            {creating ? 'Creando...' : '+ Crear Sesión'}
          </button>
        </form>
      </div>

      {/* Lista de sesiones */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No hay sesiones creadas aún.</p>
          <p className="text-sm mt-1">Crea una sesión para comenzar.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {sessions.map(session => (
            <div key={session.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{session.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      session.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {session.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Creada: {new Date(session.created_at).toLocaleDateString('es-MX')} — 
                    {' '}{session.respondent_count} encuestado(s)
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleSession(session.id, session.is_active)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        session.is_active
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {session.is_active ? 'Deshabilitar' : 'Habilitar'}
                    </button>
                    <Link
                      href={`/admin/sesiones/${session.id}`}
                      className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Ver Detalle
                    </Link>
                    <button
                      onClick={() => deleteSession(session.id, session.name)}
                      disabled={deleting === session.id}
                      className="px-4 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {deleting === session.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
                {/* QR Code */}
                <div className="ml-6">
                  <QRCodeDisplay url={getSurveyUrl(session.id)} size={120} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
