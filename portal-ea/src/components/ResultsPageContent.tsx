'use client'

import RadarChart from '@/components/RadarChart'
import ResultsTable from '@/components/ResultsTable'
import BooleanPieChart from '@/components/BooleanPieChart'
import ExportPdfButton from '@/components/ExportPdfButton'
import { MaturityLevel } from '@/types/database'

interface ResultsPageContentProps {
  respondentName: string
  respondentDate: string
  sessionName: string
  chartData: { dimension: string; value: number }[]
  tableData: { dimension: string; value: number; questionCount?: number }[]
  maturityLevels: MaturityLevel[] | null
  booleanData?: { question: string; dimension: string; yesCount: number; noCount: number }[]
  textData?: { question: string; dimension: string; text: string }[]
}

export default function ResultsPageContent({
  respondentName,
  respondentDate,
  sessionName,
  chartData,
  tableData,
  maturityLevels,
  booleanData = [],
  textData = [],
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
          <ExportPdfButton
            targetId="results-content"
            fileName={fileName}
            pdfTitle="Resultados de Evaluación"
            pdfSubtitle={`${sessionName} · ${respondentName} · ${respondentDate}`}
          />
        </div>

        {/* Contenido capturable para PDF */}
        <div id="results-content">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Gráfico de Radar */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-bold mb-4 text-center">Gráfico de Radar</h2>
                <p className="text-xs text-gray-400 text-center mb-2">Promedio por dimensión (escala 1-5)</p>
                <RadarChart data={chartData} />
              </div>
            )}

            {/* Tabla de Resultados */}
            {tableData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-bold mb-4 text-center">Resumen por Dimensión</h2>
                <p className="text-xs text-gray-400 text-center mb-2">Suma de respuestas por dimensión (escala 1-5)</p>
                <ResultsTable data={tableData} maturityLevels={maturityLevels} />
              </div>
            )}
          </div>

          {/* Preguntas Boolean — Pie Charts */}
          {booleanData.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold mb-4">Respuestas Sí / No</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {booleanData.map((item, idx) => (
                  <BooleanPieChart
                    key={idx}
                    question={item.question}
                    yesCount={item.yesCount}
                    noCount={item.noCount}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Respuestas de Texto Libre */}
          {textData.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold mb-4">Respuestas Abiertas</h2>
              <div className="space-y-3">
                {textData.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg border p-4">
                    <p className="text-xs text-gray-400 mb-1">{item.dimension}</p>
                    <p className="text-sm text-gray-700 font-medium mb-2">{item.question}</p>
                    <p className="text-sm text-gray-900 bg-gray-50 rounded p-3 italic">&ldquo;{item.text}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
