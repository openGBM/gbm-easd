'use client'

import { getDimensionMaturityLevel, getMaturityLevel } from '@/types/database'

interface ResultsTableProps {
  data: { dimension: string; value: number; questionCount?: number }[]
}

export default function ResultsTable({ data }: ResultsTableProps) {
  // Calcular totales dinámicos
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const totalQuestions = data.reduce((sum, item) => sum + (item.questionCount || 6), 0)
  const maxTotal = totalQuestions * 5
  const { level, color } = getMaturityLevel(total, totalQuestions)

  return (
    <div>
      {/* Nivel de madurez global */}
      <div className="text-center mb-6 p-4 rounded-lg border" style={{ borderColor: color }}>
        <p className="text-sm text-gray-500 mb-1">Nivel de Madurez Global</p>
        <p className="text-3xl font-bold" style={{ color }}>
          {level}
        </p>
        <p className="text-gray-600 mt-1">
          Puntaje total: {total} / {maxTotal}
        </p>
      </div>

      {/* Tabla de resultados por dimensión */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-3 py-2 border-b font-medium text-gray-700">
              Dimensión
            </th>
            <th className="text-center px-3 py-2 border-b font-medium text-gray-700 w-16">
              Suma
            </th>
            <th className="text-center px-3 py-2 border-b font-medium text-gray-700 w-24">
              Nivel
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const qCount = item.questionCount || 6
            const maxDim = qCount * 5
            const dimLevel = getDimensionMaturityLevel(item.value, qCount)
            return (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-3 py-2 border-b text-gray-800">
                  {item.dimension}
                </td>
                <td className="px-3 py-2 border-b text-center font-bold">
                  {item.value}/{maxDim}
                </td>
                <td className="px-3 py-2 border-b text-center">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${dimLevel.color}20`, color: dimLevel.color }}
                  >
                    {dimLevel.level}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold">
            <td className="px-3 py-2 border-t">Total</td>
            <td className="px-3 py-2 border-t text-center">{total}/{maxTotal}</td>
            <td className="px-3 py-2 border-t text-center">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {level}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Leyenda dinámica */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs font-medium text-gray-700 mb-1">Clave de Evaluación:</p>
        <div className="flex gap-3 text-xs">
          <span className="text-red-500">● Tercio inferior: Naciente</span>
          <span className="text-yellow-500">● Tercio medio: Base</span>
          <span className="text-green-500">● Tercio superior: Clase Mundial</span>
        </div>
      </div>
    </div>
  )
}
