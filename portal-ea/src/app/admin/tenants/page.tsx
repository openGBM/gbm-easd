'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Tenant } from '@/types/users'
import { showToast } from '@/components/Toast'
import Link from 'next/link'

export default function TenantsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  async function checkAuthAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/admin/login'); return }
    await loadTenants()
  }

  async function loadTenants() {
    const res = await fetch('/api/tenants')
    if (res.status === 403) {
      showToast('error', 'Solo el super admin puede gestionar áreas')
      router.push('/admin')
      return
    }
    if (res.ok) {
      const data = await res.json()
      setTenants(data.tenants)
    }
    setLoading(false)
  }

  async function createTenant(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)

    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), description: newDescription.trim() || undefined }),
    })

    if (res.ok) {
      showToast('success', `Área "${newName.trim()}" creada`)
      setNewName('')
      setNewDescription('')
      await loadTenants()
    } else {
      const err = await res.json()
      showToast('error', err.error || 'Error al crear área')
    }
    setCreating(false)
  }

  async function updateTenant(id: string, updates: Record<string, any>) {
    const res = await fetch(`/api/tenants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (res.ok) {
      await loadTenants()
    } else {
      const err = await res.json()
      showToast('error', err.error || 'Error al actualizar')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Cargando áreas...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🏢 Áreas (Tenants)</h1>
        <Link href="/admin" className="text-blue-600 hover:text-blue-700 text-sm">← Volver</Link>
      </div>

      {/* Crear nueva área */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-6">
        <h2 className="text-base font-medium mb-3">Crear Nueva Área</h2>
        <form onSubmit={createTenant} className="space-y-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nombre del área (ej: Human Capital)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            required
          />
          <input
            type="text"
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {creating ? 'Creando...' : '+ Crear Área'}
          </button>
        </form>
      </div>

      {/* Lista de áreas */}
      {tenants.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No hay áreas creadas.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tenants.map(tenant => (
            <div key={tenant.id} className="bg-white rounded-xl shadow-sm border p-4 sm:p-5">
              <div className="flex flex-col gap-3">
                {/* Header: nombre + estado */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      defaultValue={tenant.name}
                      onBlur={e => updateTenant(tenant.id, { name: e.target.value.trim() })}
                      className="font-bold text-gray-900 px-2 py-0.5 border border-transparent hover:border-gray-300 focus:border-blue-400 rounded text-sm focus:outline-none"
                    />
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                      tenant.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {tenant.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <button
                    onClick={() => updateTenant(tenant.id, { is_active: !tenant.is_active })}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      tenant.is_active
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {tenant.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>

                {/* Descripción editable */}
                <input
                  type="text"
                  defaultValue={tenant.description || ''}
                  onBlur={e => updateTenant(tenant.id, { description: e.target.value.trim() })}
                  placeholder="Descripción (opcional)"
                  className="text-sm text-gray-500 px-2 py-0.5 border border-transparent hover:border-gray-300 focus:border-blue-400 rounded focus:outline-none w-full"
                />

                {/* Límites editables */}
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  <label className="flex items-center gap-1">
                    Sesiones activas:
                    <input
                      type="number"
                      defaultValue={tenant.max_active_sessions}
                      onBlur={e => updateTenant(tenant.id, { max_active_sessions: parseInt(e.target.value) || 10 })}
                      className="w-14 px-1 py-0.5 border border-gray-200 rounded text-center"
                      min={1}
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    Análisis/mes:
                    <input
                      type="number"
                      defaultValue={tenant.max_analyses_per_month}
                      onBlur={e => updateTenant(tenant.id, { max_analyses_per_month: parseInt(e.target.value) || 50 })}
                      className="w-14 px-1 py-0.5 border border-gray-200 rounded text-center"
                      min={1}
                    />
                  </label>
                  <span className="text-gray-400">
                    Creada: {new Date(tenant.created_at).toLocaleDateString('es-MX')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
