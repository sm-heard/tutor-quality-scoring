"use client"

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type RiskBucket = {
  band: string
  label: string
  count: number
  color: string
}

type RiskDistributionChartProps = {
  data: RiskBucket[]
}

export function RiskDistributionChart({ data }: RiskDistributionChartProps) {
  return (
    <ChartContainer config={{ count: { label: "Tutors", color: "#06b6d4" } }}>
      <BarChart data={data}>
        <CartesianGrid
          vertical={false}
          strokeDasharray="1 3"
          stroke="rgba(6, 182, 212, 0.1)"
        />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
        />
        <YAxis
          allowDecimals={false}
          width={36}
          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip
          cursor={{ fill: 'rgba(6, 182, 212, 0.05)' }}
          content={<ChartTooltipContent />}
        />
        <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
          {data.map((bucket) => (
            <Cell
              key={bucket.band}
              fill={bucket.color}
              stroke={bucket.color}
              strokeWidth={0}
              opacity={0.9}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

