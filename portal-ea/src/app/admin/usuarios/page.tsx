'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProfileWithTenant, Tenant } from '@/types/users'
import { showToast } from '@/components/Toast'
import Link from 'next/link'

export default function UsuariosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [users, setUsers] = useState<ProfileWithTenant[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // Formulario
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'editor'>('editor')
  const [newTenantId, setNewTenantId] = useState('')

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  async function checkAuthAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/admin/login'); return }
    await Promise.all([loadUsers(), loadTenants()])
  }

  async function loadUsers() {
    const res = await fetch('/api/users')
    if (res.status === 403) {
      showToast('error', 'Sin permisos para gestionar usuarios')
      router.push('/admin')
      return
    }
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users)
    }
    setLoading(false)
  }

  async function loadTenants() {
    const res = await fetch('/api/tenants')
    if (res.ok) {
      const data = await res.json()
      setTenants(data.tenants)
      if (data.tenants.length > 0 && !newTenantId) {
        setNewTenantId(data.tenants[0].id)
      }
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim() || !newName.trim() || !newPassword || !newTenantId) return
    setCreating(true)

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newEmail.trim(),
        full_name: newName.trim(),
        password: newPassword,
        role: newRole,
        tenant_id: newTenantId,
      }),
    })

    if (res.ok) {
      showToast('success', `Usuario "${newName.trim()}" creado`)
      setNewEmail('')
      setNewName('')
      setNewPassword('')
      setNewRole('editor')
      await loadUsers()
    } else {
      const err = await res.json()
      showToast('error', err.error || 'Error al crear usuario')
    }
    setCreating(false)
  }

  async function toggleUser(id: string, isActive: boolean) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })

    if (res.ok) {
      showToast('success', isActive ? 'Usuario desactivado' : 'Usuario activado')
      await loadUsers()
    } else {
      const err = await res.json()
      showToast('error', err.error || 'Error al actualizar')
    }
  }

  const roleLabel: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin de Área',
    editor: 'Editor',
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Cargando usuarios...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">👥 Usuarios</h1>
        <Link href="/admin" className="text-blue-600 hover:text-blue-700 text-sm">← Volver</Link>
      </div>

      {/* Crear nuevo usuario */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-6">
        <h2 className="text-base font-medium mb-3">Crear Nuevo Usuario</h2>
        <form onSubmit={createUser} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nombre completo"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="Correo electrónico"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Contraseña (mín. 8 caracteres)"
              minLength={8}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value as 'admin' | 'editor')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin de Área</option>
            </select>
            <select
              value={newTenantId}
              onChange={e => setNewTenantId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            >
              <option value="">Seleccionar área...</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {creating ? 'Creando...' : '+ Crear Usuario'}
          </button>
        </form>
      </div>

      {/* Lista de usuarios */}
      {users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No hay usuarios registrados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Área</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {roleLabel[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.tenants?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== 'super_admin' && (
                        <button
                          onClick={() => toggleUser(u.id, u.is_active)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            u.is_active
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {u.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
