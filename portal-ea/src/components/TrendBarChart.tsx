'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendDataPoint, DimensionInfo } from '@/lib/analytics/transformTrendData'
import { ReactNode } from 'react'

interface TrendBarChartProps {
  data: TrendDataPoint[]
  type: 'general' | 'byDimension'
  dimensions?: DimensionInfo[]
}

export default function TrendBarChart({ data, type, dimensions = [] }: TrendBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No hay datos para mostrar
      </div>
    )
  }

  if (type === 'general') {
    const chartData = data.map(point => ({
      name: point.sessionName.length > 20
        ? point.sessionName.substring(0, 20) + '...'
        : point.sessionName,
      fullName: point.sessionName,
      promedio: point.generalAvg,
    }))

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-35}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 11 }}
          />
          <YAxis domain={[0, 5]} tickCount={6} />
          <Tooltip
            formatter={(value) => [(value as number).toFixed(1), 'Promedio']}
            labelFormatter={(label: ReactNode, payload) => (payload as any)?.[0]?.payload?.fullName || label}
          />
          <Bar dataKey="promedio" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // type === 'byDimension'
  const chartData = data.map(point => ({
    name: point.sessionName.length > 15
      ? point.sessionName.substring(0, 15) + '...'
      : point.sessionName,
    fullName: point.sessionName,
    ...point.dimensionAvgs,
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={-35}
          textAnchor="end"
          height={80}
          tick={{ fontSize: 11 }}
        />
        <YAxis domain={[0, 5]} tickCount={6} />
        <Tooltip
          formatter={(value, name) => [(value as number).toFixed(1), name]}
          labelFormatter={(label: ReactNode, payload) => (payload as any)?.[0]?.payload?.fullName || label}
        />
        <Legend wrapperStyle={{ paddingTop: 10 }} />
        {dimensions.map(dim => (
          <Bar
            key={dim.name}
            dataKey={dim.name}
            fill={dim.color}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
