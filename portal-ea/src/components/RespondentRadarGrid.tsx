'use client'

import RadarChart from '@/components/RadarChart'
import { RespondentRadarData } from '@/lib/analytics/transformRespondentHistory'

interface RespondentRadarGridProps {
  sessions: RespondentRadarData[]
}

export default function RespondentRadarGrid({ sessions }: RespondentRadarGridProps) {
  if (sessions.length === 0) {
    return <p className="text-gray-400 text-center py-4">No hay datos para mostrar</p>
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {sessions.map(session => (
        <div key={session.sessionId} className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-center mb-2">
            <h4 className="text-sm font-bold text-gray-800">{session.sessionName}</h4>
            <p className="text-xs text-gray-400">
              {new Date(session.date).toLocaleDateString('es-MX')}
            </p>
          </div>
          <RadarChart data={session.data} />
        </div>
      ))}
    </div>
  )
}
