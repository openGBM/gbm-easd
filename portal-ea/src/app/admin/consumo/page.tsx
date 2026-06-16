'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface TokensByModel {
  [model: string]: { input: number; output: number; count: number }
}

interface UserSummary {
  email: string
  sessions_created: number
  analyses_generated: number
  tokens_by_model: TokensByModel
}

interface UsageDetail {
  user_email: string
  action: string
  model: string | null
  input_tokens: number
  output_tokens: number
  created_at: string
}

export default function ConsumoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [summary, setSummary] = useState<UserSummary[]>([])
  const [details, setDetails] = useState<UsageDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'summary' | 'details'>('summary')

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  async function checkAuthAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }
    await loadUsage()
  }

  async function loadUsage() {
    try {
      const res = await fetch('/api/usage')
      if (!res.ok) {
        setLoading(false)
        return
      }
      const data = await res.json()
      setSummary(data.summary || [])
      setDetails(data.details || [])
    } catch {
      // silently fail
    }
    setLoading(false)
  }

  function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Cargando consumo...</p>
      </div>
    )
  }

  // Totales globales
  const totalSessions = summary.reduce((s, u) => s + u.sessions_created, 0)
  const totalAnalyses = summary.reduce((s, u) => s + u.analyses_generated, 0)
  const totalTokens = summary.reduce((s, u) => {
    return s + Object.values(u.tokens_by_model).reduce((t, m) => t + m.input + m.output, 0)
  }, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Consumo y Uso</h1>
        <Link href="/admin" className="text-blue-600 hover:text-blue-700 text-sm">
          ← Volver
        </Link>
      </div>

      {/* Métricas globales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500 mb-1">Sesiones Creadas</p>
          <p className="text-3xl font-bold text-blue-600">{totalSessions}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500 mb-1">Análisis IA Generados</p>
          <p className="text-3xl font-bold text-indigo-600">{totalAnalyses}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500 mb-1">Tokens Consumidos</p>
          <p className="text-3xl font-bold text-purple-600">{formatNumber(totalTokens)}</p>
        </div>
      </div>

      {/* Toggle vista */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('summary')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'summary' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Resumen por Usuario
        </button>
        <button
          onClick={() => setView('details')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'details' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Detalle de Actividad
        </button>
      </div>

      {/* Vista Resumen */}
      {view === 'summary' && (
        <div className="space-y-4">
          {summary.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
              <p>No hay datos de consumo registrados aún.</p>
              <p className="text-sm mt-1">Los datos se registran automáticamente al crear sesiones y generar análisis IA.</p>
            </div>
          ) : (
            summary.map(user => (
              <div key={user.email} className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <h3 className="font-bold text-gray-900">{user.email}</h3>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>{user.sessions_created} sesiones</span>
                    <span>{user.analyses_generated} análisis</span>
                  </div>
                </div>

                {/* Tokens por modelo */}
                {Object.keys(user.tokens_by_model).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">Tokens por modelo:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(user.tokens_by_model).map(([model, usage]) => (
                        <div key={model} className="bg-gray-50 rounded-lg p-3 text-sm">
                          <p className="font-medium text-gray-700 mb-1">{model}</p>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>Entrada: {formatNumber(usage.input)}</span>
                            <span>Salida: {formatNumber(usage.output)}</span>
                            <span>{usage.count} llamadas</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Vista Detalle */}
      {view === 'details' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {details.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No hay actividad registrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Acción</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Modelo</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Tokens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {details.map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2 text-gray-700">{log.user_email}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.action === 'analysis'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {log.action === 'analysis' ? 'Análisis IA' : 'Crear sesión'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-xs font-mono">
                        {log.model || '—'}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">
                        {log.input_tokens + log.output_tokens > 0
                          ? formatNumber(log.input_tokens + log.output_tokens)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
