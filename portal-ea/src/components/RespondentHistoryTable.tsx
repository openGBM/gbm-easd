'use client'

import { RespondentSession } from '@/lib/analytics/transformRespondentHistory'
import InstrumentBadge from '@/components/InstrumentBadge'

interface RespondentHistoryTableProps {
  history: RespondentSession[]
}

export default function RespondentHistoryTable({ history }: RespondentHistoryTableProps) {
  if (history.length === 0) {
    return <p className="text-gray-400 text-center py-4">No hay participaciones registradas</p>
  }

  const showInstrument = true  // Siempre mostrar columna de instrumento

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-3 py-2 border-b font-medium text-gray-700">Sesión</th>
            {showInstrument && (
              <th className="text-center px-3 py-2 border-b font-medium text-gray-700">Instrumento</th>
            )}
            <th className="text-center px-3 py-2 border-b font-medium text-gray-700">Fecha</th>
            <th className="text-center px-3 py-2 border-b font-medium text-gray-700">Puntaje</th>
            <th className="text-center px-3 py-2 border-b font-medium text-gray-700">Nivel</th>
          </tr>
        </thead>
        <tbody>
          {history.map(session => (
            <tr key={session.sessionId} className="hover:bg-gray-50">
              <td className="px-3 py-2 border-b text-gray-800 font-medium">
                {session.sessionName}
              </td>
              {showInstrument && (
                <td className="px-3 py-2 border-b text-center">
                  {session.instrumentName && session.versionTag ? (
                    <InstrumentBadge
                      instrumentName={session.instrumentName}
                      versionTag={session.versionTag}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
              )}
              <td className="px-3 py-2 border-b text-center text-gray-600">
                {new Date(session.date).toLocaleDateString('es-MX')}
              </td>
              <td className="px-3 py-2 border-b text-center font-bold">
                {session.totalScore}/{session.maxScore}
              </td>
              <td className="px-3 py-2 border-b text-center">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${session.maturityColor}20`,
                    color: session.maturityColor,
                  }}
                >
                  {session.maturityLevel}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
