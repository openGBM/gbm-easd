'use client'

export default function EncuestaError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 text-2xl">!</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Error al cargar la encuesta
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Ocurrió un problema al cargar esta evaluación. Por favor intenta de nuevo o contacta al administrador.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
