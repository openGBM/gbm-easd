'use client'

interface SessionOption {
  id: string
  name: string
  date: string
}

interface TrendFiltersProps {
  sessions: SessionOption[]
  dateFrom: string | null
  dateTo: string | null
  selectedSessions: Set<string>
  onDateFromChange: (value: string | null) => void
  onDateToChange: (value: string | null) => void
  onSessionToggle: (sessionId: string) => void
  onSelectAll: () => void
  onClearAll: () => void
}

export default function TrendFilters({
  sessions,
  dateFrom,
  dateTo,
  selectedSessions,
  onDateFromChange,
  onDateToChange,
  onSessionToggle,
  onSelectAll,
  onClearAll,
}: TrendFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
      <h3 className="text-sm font-bold text-gray-700">Filtros</h3>

      {/* Filtro de fechas */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Desde</label>
          <input
            type="date"
            value={dateFrom || ''}
            onChange={e => onDateFromChange(e.target.value || null)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Hasta</label>
          <input
            type="date"
            value={dateTo || ''}
            onChange={e => onDateToChange(e.target.value || null)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filtro de sesiones */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-gray-500">Sesiones</label>
          <div className="flex gap-2">
            <button
              onClick={onSelectAll}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Todas
            </button>
            <span className="text-xs text-gray-300">|</span>
            <button
              onClick={onClearAll}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              Ninguna
            </button>
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1.5 border rounded-lg p-2">
          {sessions.map(session => (
            <label
              key={session.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
            >
              <input
                type="checkbox"
                checked={selectedSessions.has(session.id)}
                onChange={() => onSessionToggle(session.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 truncate flex-1">
                {session.name}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(session.date).toLocaleDateString('es-MX')}
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {selectedSessions.size === 0
            ? 'Mostrando todas las sesiones'
            : `${selectedSessions.size} de ${sessions.length} seleccionada(s)`}
        </p>
      </div>
    </div>
  )
}
