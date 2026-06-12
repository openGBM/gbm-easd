'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[AdminError]', error.message, error.digest)
  }, [error])

  return (
    <div className="text-center py-12 max-w-md mx-auto">
      <div className="text-5xl mb-4">🔧</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Error en el panel
      </h2>
      <p className="text-gray-600 mb-6">
        Ocurrió un error al cargar esta sección. Esto puede ser temporal.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          Reintentar
        </button>
        <Link
          href="/admin"
          className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
        >
          Ir al Dashboard
        </Link>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-6 text-left text-xs bg-red-50 text-red-800 p-4 rounded-lg overflow-auto max-h-48">
          {error.message}
          {'\n'}
          {error.stack}
        </pre>
      )}
    </div>
  )
}
