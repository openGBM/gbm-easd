'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface BooleanPieChartProps {
  question: string
  yesCount: number
  noCount: number
}

const COLORS = ['#10B981', '#EF4444'] // verde = sí, rojo = no

export default function BooleanPieChart({ question, yesCount, noCount }: BooleanPieChartProps) {
  const total = yesCount + noCount
  if (total === 0) return null

  const data = [
    { name: 'Sí', value: yesCount },
    { name: 'No', value: noCount },
  ]

  return (
    <div className="bg-white rounded-lg border p-4">
      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{question}</p>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={60}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [`${value} respuesta(s)`, '']} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 text-xs text-gray-500 mt-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500"></span> Sí: {yesCount}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500"></span> No: {noCount}
        </span>
      </div>
    </div>
  )
}
