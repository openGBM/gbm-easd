'use client'

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface RadarChartProps {
  data: { dimension: string; value: number }[]
}

export default function RadarChart({ data }: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
        <PolarGrid />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} />
        <Tooltip />
        <Radar
          name="Evaluación"
          dataKey="value"
          stroke="#2563EB"
          fill="#3B82F6"
          fillOpacity={0.4}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
}
