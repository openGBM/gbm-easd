'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Session, InstrumentWithVersion, SessionWithInstrument } from '@/types/database'
import { isMultiInstrumentEnabled } from '@/flags'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import InstrumentBadge from '@/components/InstrumentBadge'
import InstrumentSelector from '@/components/InstrumentSelector'
import Link from 'next/link'

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [sessions, setSessions] = useState<(SessionWithInstrument & { respondent_count: number })[]>([])
  const [newSessionName, setNewSessionName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [stats, setStats] = useState({ activeSessions: 0, totalResponses: 0, avgTimeMinutes: 0, totalInstruments: 0 })
  // Multi-instrumento
  const [multiInstrumentEnabled, setMultiInstrumentEnabled] = useState(false)
  const [instruments, setInstruments] = useState<InstrumentWithVersion[]>([])
  const [selectedInstrumentId, setSelectedInstrumentId] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }
    // Feature flag multi-instrumento
    const flagEnabled = isMultiInstrumentEnabled()
    setMultiInstrumentEnabled(flagEnabled)

    if (flagEnabled) {
      await loadInstruments()
    }
    loadSessions()
  }

  async function loadInstruments() {
    const { data } = await supabase
      .from('instruments')
      .select('*, instrument_versions(*)')
      .eq('is_active', true)
      .order('name')

    if (data) {
      const formatted: InstrumentWithVersion[] = data.map(inst => ({
        ...inst,
        current_version: inst.instrument_versions?.find((v: any) => v.is_current) || undefined,
      }))
      setInstruments(formatted)
      if (formatted.length > 0 && !selectedInstrumentId) {
        setSelectedInstrumentId(formatted[0].id)
      }
    }
  }

  async function loadSessions() {
    const { data } = await supabase
      .from('sessions')
      .select('*, respondents(count), instrument_versions(version_tag, instruments(name))')
      .order('created_at', { ascending: false })

    if (data) {
      const formatted = data.map(s => ({
        ...s,
        respondent_count: s.respondents?.[0]?.count || 0,
      }))
      setSessions(formatted)
    }

    await loadStats()
    setLoading(false)
  }

  async function loadStats() {
    // Total sesiones habilitadas
    const { count: activeSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Total respuestas completadas (encuestados que terminaron)
    const { count: totalResponses } = await supabase
      .from('respondents')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true)

    // Tiempo promedio de respuesta (completed_at - created_at)
    const { data: completedRespondents } = await supabase
      .from('respondents')
      .select('created_at, completed_at')
      .eq('completed', true)
      .not('completed_at', 'is', null)

    let avgTimeMinutes = 0
    if (completedRespondents && completedRespondents.length > 0) {
      const totalMinutes = completedRespondents.reduce((sum, r) => {
        const start = new Date(r.created_at).getTime()
        const end = new Date(r.completed_at!).getTime()
        return sum + (end - start) / 1000 / 60
      }, 0)
      avgTimeMinutes = Math.round(totalMinutes / completedRespondents.length)
    }

    // Total instrumentos activos
    const { count: totalInstruments } = await supabase
      .from('instruments')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    setStats({
      activeSessions: activeSessions || 0,
      totalResponses: totalResponses || 0,
      avgTimeMinutes,
      totalInstruments: totalInstruments || 0,
    })
  }

  async function createSession(e: React.FormEvent) {
    e.preventDefault()
    if (!newSessionName.trim()) return

    setCreating(true)

    // Si multi-instrumento está habilitado, asociar la versión current del instrumento seleccionado
    let instrumentVersionId: string | null = null
    if (multiInstrumentEnabled && selectedInstrumentId) {
      const selectedInst = instruments.find(i => i.id === selectedInstrumentId)
      if (selectedInst?.current_version) {
        instrumentVersionId = selectedInst.current_version.id
      }
    }

    const insertData: any = { name: newSessionName.trim() }
    if (instrumentVersionId) {
      insertData.instrument_version_id = instrumentVersionId
    }

    const { error } = await supabase
      .from('sessions')
      .insert(insertData)

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

      {/* Dashboard de métricas */}
      <div className={`grid grid-cols-1 ${multiInstrumentEnabled ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 mb-8`}>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500 mb-1">Sesiones Habilitadas</p>
          <p className="text-3xl font-bold text-blue-600">{stats.activeSessions}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500 mb-1">Respuestas Recolectadas</p>
          <p className="text-3xl font-bold text-green-600">{stats.totalResponses}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500 mb-1">Tiempo Promedio de Respuesta</p>
          <p className="text-3xl font-bold text-purple-600">
            {stats.avgTimeMinutes > 0 ? `${stats.avgTimeMinutes} min` : '—'}
          </p>
        </div>
        {multiInstrumentEnabled && (
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500 mb-1">Instrumentos</p>
            <p className="text-3xl font-bold text-indigo-600">{stats.totalInstruments}</p>
          </div>
        )}
      </div>

      {/* Crear nueva sesión */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Crear Nueva Sesión</h2>
        <form onSubmit={createSession} className="space-y-4">
          {multiInstrumentEnabled && instruments.length > 0 && (
            <InstrumentSelector
              instruments={instruments}
              selectedId={selectedInstrumentId}
              onChange={setSelectedInstrumentId}
            />
          )}
          <div className="flex gap-4">
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
          </div>
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
                    {multiInstrumentEnabled && session.instrument_versions && (
                      <InstrumentBadge
                        instrumentName={session.instrument_versions.instruments.name}
                        versionTag={session.instrument_versions.version_tag}
                      />
                    )}
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
