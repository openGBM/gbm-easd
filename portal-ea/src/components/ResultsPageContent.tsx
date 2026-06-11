'use client'

import RadarChart from '@/components/RadarChart'
import ResultsTable from '@/components/ResultsTable'
import ExportPdfButton from '@/components/ExportPdfButton'
import { MaturityLevel } from '@/types/database'

interface ResultsPageContentProps {
  respondentName: string
  respondentDate: string
  sessionName: string
  chartData: { dimension: string; value: number }[]
  tableData: { dimension: string; value: number; questionCount?: number }[]
  maturityLevels: MaturityLevel[] | null
}

export default function ResultsPageContent({
  respondentName,
  respondentDate,
  sessionName,
  chartData,
  tableData,
  maturityLevels,
}: ResultsPageContentProps) {
  const fileName = `resultados-${respondentName.replace(/\s+/g, '-').toLowerCase()}-${respondentDate}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <img src="/logo-gbm.png" alt="GBM" className="h-10 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">
            Resultados de Evaluación
          </h1>
          {sessionName && (
            <p className="text-lg text-gray-700 mt-1">{sessionName}</p>
          )}
          <p className="text-gray-600 mt-2">
            Encuestado: {respondentName} — {respondentDate}
          </p>
        </div>

        {/* Botón de exportación */}
        <div className="flex justify-center mb-6">
          <ExportPdfButton targetId="results-content" fileName={fileName} />
        </div>

        {/* Contenido capturable para PDF */}
        <div id="results-content">
          {/* Header dentro del PDF */}
          <div className="text-center mb-6 hidden print:block" aria-hidden="true">
            <h1 className="text-2xl font-bold text-gray-900">Resultados de Evaluación</h1>
            <p className="text-gray-600">{sessionName} — {respondentName} — {respondentDate}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Gráfico de Radar */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold mb-4 text-center">Gráfico de Radar</h2>
              <p className="text-xs text-gray-400 text-center mb-2">Promedio por dimensión (escala 1-5)</p>
              <RadarChart data={chartData} />
            </div>

            {/* Tabla de Resultados */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold mb-4 text-center">Resumen por Dimensión</h2>
              <p className="text-xs text-gray-400 text-center mb-2">Suma de respuestas por dimensión (escala 1-5)</p>
              <ResultsTable data={tableData} maturityLevels={maturityLevels} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
