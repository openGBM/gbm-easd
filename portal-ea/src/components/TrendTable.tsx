'use client'

import { TrendDataPoint, DimensionInfo } from '@/lib/analytics/transformTrendData'

interface TrendTableProps {
  data: TrendDataPoint[]
  dimensions: DimensionInfo[]
}

export default function TrendTable({ data, dimensions }: TrendTableProps) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-center py-4">No hay datos para mostrar</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-3 py-2 border-b font-medium text-gray-700">Sesión</th>
            <th className="text-center px-3 py-2 border-b font-medium text-gray-700">Fecha</th>
            <th className="text-center px-3 py-2 border-b font-medium text-gray-700">Prom. General</th>
            {dimensions.map(dim => (
              <th
                key={dim.name}
                className="text-center px-2 py-2 border-b font-medium"
                style={{ color: dim.color }}
                title={dim.name}
              >
                {dim.name.length > 12 ? dim.name.substring(0, 12) + '…' : dim.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(point => (
            <tr key={point.sessionId} className="hover:bg-gray-50">
              <td className="px-3 py-2 border-b text-gray-800 font-medium">
                {point.sessionName}
              </td>
              <td className="px-3 py-2 border-b text-center text-gray-600">
                {new Date(point.sessionDate).toLocaleDateString('es-MX')}
              </td>
              <td className="px-3 py-2 border-b text-center font-bold text-blue-600">
                {point.generalAvg.toFixed(1)}
              </td>
              {dimensions.map(dim => (
                <td key={dim.name} className="px-2 py-2 border-b text-center">
                  {point.dimensionAvgs[dim.name]?.toFixed(1) ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
