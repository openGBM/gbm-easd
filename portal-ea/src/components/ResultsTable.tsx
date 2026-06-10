'use client'

import { getDimensionMaturityLevel, getMaturityLevel, MaturityLevel } from '@/types/database'

interface ResultsTableProps {
  data: { dimension: string; value: number; questionCount?: number }[]
  /** 'sum' = valor es suma total de la dimensión; 'average' = valor es promedio 1-5 */
  mode?: 'sum' | 'average'
  /** Niveles de madurez personalizados (si no se pasan, usa tercios automáticos) */
  maturityLevels?: MaturityLevel[] | null
}

export default function ResultsTable({ data, mode = 'sum', maturityLevels }: ResultsTableProps) {

  function getCustomLevel(avg: number): { level: string; color: string } {
    if (maturityLevels && maturityLevels.length > 0) {
      const sorted = [...maturityLevels].sort((a, b) => a.minAverage - b.minAverage)
      // Buscar el nivel exacto
      for (const lvl of sorted) {
        if (avg >= lvl.minAverage && avg <= lvl.maxAverage) {
          return { level: lvl.label, color: lvl.color }
        }
      }
      // Si cae en un hueco, usar el nivel más cercano
      let closest = sorted[0]
      let minDist = Infinity
      for (const lvl of sorted) {
        const dist = Math.min(Math.abs(avg - lvl.minAverage), Math.abs(avg - lvl.maxAverage))
        if (dist < minDist) {
          minDist = dist
          closest = lvl
        }
      }
      return { level: closest.label, color: closest.color }
    }
    // Default: tercios
    if (avg < 2.4) return { level: 'Naciente', color: '#EF4444' }
    if (avg < 3.7) return { level: 'Base', color: '#F59E0B' }
    return { level: 'Clase Mundial', color: '#10B981' }
  }
  if (mode === 'average') {
    // Modo promedio: value está entre 1-5, calcular nivel basado en promedio
    const avgGlobal = data.length > 0
      ? Math.round((data.reduce((sum, item) => sum + item.value, 0) / data.length) * 10) / 10
      : 0

    const globalLevel = getCustomLevel(avgGlobal)

    return (
      <div>
        {/* Nivel de madurez global */}
        <div className="text-center mb-6 p-4 rounded-lg border" style={{ borderColor: globalLevel.color }}>
          <p className="text-sm text-gray-500 mb-1">Nivel de Madurez Global</p>
          <p className="text-3xl font-bold" style={{ color: globalLevel.color }}>
            {globalLevel.level}
          </p>
          <p className="text-gray-600 mt-1">
            Promedio general: {avgGlobal} / 5.0
          </p>
        </div>

        {/* Tabla de resultados por dimensión */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2 border-b font-medium text-gray-700">
                Dimensión
              </th>
              <th className="text-center px-3 py-2 border-b font-medium text-gray-700 w-20">
                Promedio
              </th>
              <th className="text-center px-3 py-2 border-b font-medium text-gray-700 w-24">
                Nivel
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const dimLevel = getCustomLevel(item.value)
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-b text-gray-800">
                    {item.dimension}
                  </td>
                  <td className="px-3 py-2 border-b text-center font-bold">
                    {item.value} / 5.0
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
        </table>

        {/* Leyenda */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-1">Clave de Evaluación (promedio 1-5):</p>
          <div className="flex flex-wrap gap-3 text-xs">
            {maturityLevels && maturityLevels.length > 0 ? (
              [...maturityLevels].sort((a, b) => a.minAverage - b.minAverage).map(lvl => (
                <span key={lvl.label} style={{ color: lvl.color }}>
                  ● {lvl.minAverage}–{lvl.maxAverage}: {lvl.label}
                </span>
              ))
            ) : (
              <>
                <span className="text-red-500">● 1.0–2.3: Naciente</span>
                <span className="text-yellow-500">● 2.4–3.6: Base</span>
                <span className="text-green-500">● 3.7–5.0: Clase Mundial</span>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Modo suma (default): value es la suma total por dimensión
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const totalQuestions = data.reduce((sum, item) => sum + (item.questionCount || 6), 0)
  const maxTotal = totalQuestions * 5

  // Si hay niveles personalizados, calcular usando promedio; sino usar función estándar
  const avgForGlobal = totalQuestions > 0 ? total / totalQuestions : 0
  const globalResult = maturityLevels && maturityLevels.length > 0
    ? getCustomLevel(avgForGlobal)
    : { level: getMaturityLevel(total, totalQuestions).level, color: getMaturityLevel(total, totalQuestions).color }
  const { level, color } = globalResult

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
            // Si hay niveles personalizados, convertir suma a promedio para evaluar
            const dimAvg = qCount > 0 ? item.value / qCount : 0
            const dimLevel = maturityLevels && maturityLevels.length > 0
              ? getCustomLevel(dimAvg)
              : { level: getDimensionMaturityLevel(item.value, qCount).level, color: getDimensionMaturityLevel(item.value, qCount).color }
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
        <div className="flex flex-wrap gap-3 text-xs">
          {maturityLevels && maturityLevels.length > 0 ? (
            [...maturityLevels].sort((a, b) => a.minAverage - b.minAverage).map(lvl => (
              <span key={lvl.label} style={{ color: lvl.color }}>
                ● {lvl.minAverage}–{lvl.maxAverage}: {lvl.label}
              </span>
            ))
          ) : (
            <>
              <span className="text-red-500">● Tercio inferior: Naciente</span>
              <span className="text-yellow-500">● Tercio medio: Base</span>
              <span className="text-green-500">● Tercio superior: Clase Mundial</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
