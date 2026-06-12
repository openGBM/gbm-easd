'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 60 * 1000 // 1 minuto

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Countdown timer para lockout
  useEffect(() => {
    if (!lockedUntil) return
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000)
      if (remaining <= 0) {
        setLockedUntil(null)
        setCountdown(0)
        setAttempts(0)
        setError('')
      } else {
        setCountdown(remaining)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [lockedUntil])

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (isLocked) {
      setError(`Cuenta bloqueada temporalmente. Intenta en ${countdown} segundos.`)
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_DURATION_MS
        setLockedUntil(lockUntil)
        setCountdown(Math.ceil(LOCKOUT_DURATION_MS / 1000))
        setError(`Demasiados intentos fallidos. Cuenta bloqueada por 60 segundos.`)
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts
        setError(`Credenciales inválidas. ${remaining} intento(s) restante(s).`)
      }

      setLoading(false)
      return
    }

    // Login exitoso — resetear intentos
    setAttempts(0)
    setLockedUntil(null)
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <img src="/logo-gbm.png" alt="GBM" className="h-10 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-center mb-2">Panel de Administración</h1>
        <p className="text-gray-500 text-center mb-6">Ingresa tus credenciales</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="correo@ejemplo.com"
              required
              disabled={isLocked}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
              disabled={isLocked}
            />
          </div>

          {error && (
            <div className={`text-sm p-3 rounded-lg ${
              isLocked
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'text-red-600'
            }`}>
              {error}
              {isLocked && (
                <div className="mt-1 font-mono text-red-500 text-xs">
                  ⏳ {countdown}s restantes
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : isLocked ? `Bloqueado (${countdown}s)` : 'Ingresar'}
          </button>
        </form>

        {attempts > 0 && !isLocked && (
          <p className="text-xs text-gray-400 text-center mt-4">
            {attempts} de {MAX_ATTEMPTS} intentos usados
          </p>
        )}
      </div>
    </div>
  )
}
