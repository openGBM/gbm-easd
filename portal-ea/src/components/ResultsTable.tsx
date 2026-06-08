'use client'

import { getMaturityLevel } from '@/types/database'

interface ResultsTableProps {
  data: { dimension: string; value: number }[]
}

export default function ResultsTable({ data }: ResultsTableProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const { level, color } = getMaturityLevel(total)

  return (
    <div>
      {/* Nivel de madurez */}
      <div className="text-center mb-6 p-4 rounded-lg border" style={{ borderColor: color }}>
        <p className="text-sm text-gray-500 mb-1">Nivel de Madurez EA</p>
        <p className="text-3xl font-bold" style={{ color }}>
          {level}
        </p>
        <p className="text-gray-600 mt-1">
          Puntaje total: {total} / 30
        </p>
      </div>

      {/* Tabla de resultados */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-4 py-3 border-b font-medium text-gray-700">
              Dimensión
            </th>
            <th className="text-center px-4 py-3 border-b font-medium text-gray-700 w-24">
              Valor
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3 border-b text-gray-800">
                {item.dimension}
              </td>
              <td className="px-4 py-3 border-b text-center">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                  item.value >= 4 ? 'bg-green-500' :
                  item.value === 3 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  {item.value}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold">
            <td className="px-4 py-3 border-t">Total</td>
            <td className="px-4 py-3 border-t text-center">{total}</td>
          </tr>
        </tfoot>
      </table>

      {/* Leyenda de evaluación */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">Clave de Evaluación:</p>
        <div className="flex gap-4 text-sm">
          <span className="text-red-500">● 6–13: Naciente</span>
          <span className="text-yellow-500">● 14–23: Base</span>
          <span className="text-green-500">● 24–30: Clase Mundial</span>
        </div>
      </div>
    </div>
  )
}
