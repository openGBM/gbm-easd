'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getClientContainer } from '@/core/client-container'
import { TOKENS } from '@/core/types/tokens'
import { isOk } from '@/core/errors/result'
import { Session, InstrumentWithVersion, SessionWithInstrument } from '@/types/database'
import { isMultiInstrumentEnabled } from '@/flags'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import InstrumentBadge from '@/components/InstrumentBadge'
import InstrumentSelector from '@/components/InstrumentSelector'
import ConfirmModal from '@/components/ConfirmModal'
import Link from 'next/link'

export default function AdminDashboard() {
  const router = useRouter()
  // Auth-only: keep createClient for supabase.auth.getUser() (migrates in Auth unit)
  const supabase = createClient()
  const container = getClientContainer()
  const sessionRepo = container.resolve(TOKENS.SessionRepository)
  const respondentRepo = container.resolve(TOKENS.RespondentRepository)
  const instrumentRepo = container.resolve(TOKENS.InstrumentRepository)

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
  // Filtros
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterSearch, setFilterSearch] = useState('')
  // Modal confirmación
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null)

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
    loadSessions(flagEnabled)
  }

  async function loadInstruments() {
    const result = await instrumentRepo.findActiveForSessionCreation()
    if (isOk(result)) {
      const formatted: InstrumentWithVersion[] = result.value.map(inst => ({
        ...inst,
        id: inst.id,
        name: inst.name,
        description: inst.description,
        created_at: inst.createdAt,
        is_active: true,
        current_version: inst.activeVersion ? {
          id: inst.activeVersion.id,
          instrument_id: inst.activeVersion.instrumentId,
          version_number: inst.activeVersion.versionNumber,
          is_current: true,
        } : undefined,
      })) as any
      setInstruments(formatted)
      if (formatted.length > 0 && !selectedInstrumentId) {
        setSelectedInstrumentId(formatted[0].id)
      }
    }
  }

  async function loadSessions(flagEnabled?: boolean) {
    const result = await sessionRepo.findAllWithRespondentCount()
    if (isOk(result)) {
      const formatted = result.value.map(s => ({
        ...s,
        id: s.id,
        name: s.name,
        is_active: s.isActive,
        created_at: s.createdAt,
        instrument_version_id: s.instrumentVersionId,
        respondent_count: s.respondentCount,
        // Para InstrumentBadge
        instrument_versions: s.instrumentName && s.versionTag ? {
          instruments: { name: s.instrumentName },
          version_tag: s.versionTag,
        } : undefined,
      }))
      setSessions(formatted as any)
    }

    await loadStats()
    setLoading(false)
  }

  async function loadStats() {
    // Ejecutar queries en paralelo usando repos
    const [activeResult, completedResult, timingResult, instrumentsResult] = await Promise.all([
      sessionRepo.countActive(),
      respondentRepo.countCompleted(),
      respondentRepo.findCompletedWithTiming(),
      instrumentRepo.countActive(),
    ])

    let avgTimeMinutes = 0
    if (isOk(timingResult) && timingResult.value.length > 0) {
      const completedRespondents = timingResult.value
      const totalMinutes = completedRespondents.reduce((sum, r) => {
        const start = new Date(r.createdAt).getTime()
        const end = new Date(r.completedAt).getTime()
        return sum + (end - start) / 1000 / 60
      }, 0)
      avgTimeMinutes = Math.round(totalMinutes / completedRespondents.length)
    }

    setStats({
      activeSessions: isOk(activeResult) ? activeResult.value : 0,
      totalResponses: isOk(completedResult) ? completedResult.value : 0,
      avgTimeMinutes,
      totalInstruments: isOk(instrumentsResult) ? instrumentsResult.value : 0,
    })
  }

  async function createSession(e: React.FormEvent) {
    e.preventDefault()
    if (!newSessionName.trim()) return

    setCreating(true)

    // Verificar límite de sesiones del tenant antes de crear
    try {
      const limitRes = await fetch('/api/sessions/check-limit')
      if (limitRes.ok) {
        const limitData = await limitRes.json()
        if (!limitData.allowed) {
          alert(limitData.message || 'Límite de sesiones alcanzado. Contacta al administrador.')
          setCreating(false)
          return
        }
      }
    } catch {
      // Si falla la verificación, permitir crear (fail-open para no bloquear)
    }

    // Si multi-instrumento está habilitado, asociar la versión current del instrumento seleccionado
    let instrumentVersionId: string | null = null
    if (multiInstrumentEnabled && selectedInstrumentId) {
      const selectedInst = instruments.find(i => i.id === selectedInstrumentId)
      if ((selectedInst as any)?.current_version) {
        instrumentVersionId = (selectedInst as any).current_version.id
      }
    }

    const createResult = await sessionRepo.create({
      name: newSessionName.trim(),
      instrumentVersionId: instrumentVersionId,
    })

    if (isOk(createResult)) {
      // Registrar creación de sesión en usage_logs via API route (server-side, bypasses RLS)
      fetch('/api/usage/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_session',
          metadata: { session_name: newSessionName.trim(), instrument_id: selectedInstrumentId || null },
        }),
      }).catch(() => {}) // No bloquear si falla
      setNewSessionName('')
      await loadSessions()
    }
    setCreating(false)
  }

  async function toggleSession(id: string, isActive: boolean) {
    await sessionRepo.toggleActive(id)
    await loadSessions()
  }

  async function deleteSession(id: string, name: string) {
    setDeleteModal({ id, name })
  }

  async function confirmDeleteSession() {
    if (!deleteModal) return
    const { id } = deleteModal
    setDeleteModal(null)
    setDeleting(id)

    // Eliminar encuestados y respuestas de la sesión
    await respondentRepo.deleteBySessionId(id)
    // Eliminar la sesión
    await sessionRepo.delete(id)

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

  // Filtrar sesiones
  const filteredSessions = sessions.filter(s => {
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? s.is_active : !s.is_active)
    const matchesSearch = !filterSearch || s.name.toLowerCase().includes(filterSearch.toLowerCase())
    return matchesStatus && matchesSearch
  })

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
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Crear Nueva Sesión</h2>
        <form onSubmit={createSession} className="space-y-3">
          {multiInstrumentEnabled && instruments.length > 0 && (
            <InstrumentSelector
              instruments={instruments}
              selectedId={selectedInstrumentId}
              onChange={setSelectedInstrumentId}
            />
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newSessionName}
              onChange={e => setNewSessionName(e.target.value)}
              placeholder="Nombre de la sesión (ej: Evaluación Banco XYZ)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 whitespace-nowrap text-sm"
            >
              {creating ? 'Creando...' : '+ Crear Sesión'}
            </button>
          </div>
        </form>
      </div>

      {/* Filtros de sesiones */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
          placeholder="Buscar por nombre..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
      </div>

      {/* Lista de sesiones */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No hay sesiones creadas aún.</p>
          <p className="text-sm mt-1">Crea una sesión para comenzar.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6">
          {filteredSessions.map(session => (
            <div key={session.id} className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{session.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
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
                  <p className="text-sm text-gray-500 mb-3">
                    Creada: {new Date(session.created_at).toLocaleDateString('es-MX')} — 
                    {' '}{session.respondent_count} encuestado(s)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleSession(session.id, session.is_active)}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        session.is_active
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {session.is_active ? 'Deshabilitar' : 'Habilitar'}
                    </button>
                    <Link
                      href={`/admin/sesiones/${session.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Ver Detalle
                    </Link>
                    <button
                      onClick={() => deleteSession(session.id, session.name)}
                      disabled={deleting === session.id}
                      className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {deleting === session.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
                {/* QR Code — solo si la sesión está activa */}
                {session.is_active && (
                  <div className="shrink-0 self-center sm:self-start">
                    <QRCodeDisplay url={getSurveyUrl(session.id)} size={100} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación de borrado */}
      <ConfirmModal
        isOpen={!!deleteModal}
        title="Eliminar Sesión"
        message={`¿Eliminar la sesión "${deleteModal?.name}" y todos sus encuestados y respuestas?`}
        warning="Esta acción no se puede deshacer. Antes de eliminar una sesión asegúrese de haber exportado los datos a Excel y generado el análisis IA si lo requiere."
        confirmLabel="Sí, eliminar"
        onConfirm={confirmDeleteSession}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  )
}
