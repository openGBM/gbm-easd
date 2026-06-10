'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error(error.message, 'admin/error-boundary', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 text-2xl">!</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Algo salió mal
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Ocurrió un error inesperado al cargar esta página. Puedes intentar de nuevo o volver al dashboard.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mb-4 p-3 bg-red-50 rounded-lg text-xs text-red-800">
            <summary className="cursor-pointer font-medium">Detalle del error</summary>
            <pre className="mt-2 whitespace-pre-wrap break-all">{error.message}</pre>
          </details>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Intentar de nuevo
          </button>
          <a
            href="/admin"
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Ir al Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
