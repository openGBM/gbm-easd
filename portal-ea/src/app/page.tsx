export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-lg px-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Portal de Autodiagnóstico
        </h1>
        <h2 className="text-xl text-gray-600 mb-8">
          Arquitectura Empresarial
        </h2>
        <p className="text-gray-500 mb-8">
          Evalúa rápidamente la madurez y eficacia de tu arquitectura empresarial
          mediante una herramienta de autodiagnóstico guiada.
        </p>
        <div className="space-y-4">
          <a
            href="/admin/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Acceso Administrador
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-12">
          GBM — Evaluación de Madurez EA
        </p>
      </div>
    </div>
  )
}
