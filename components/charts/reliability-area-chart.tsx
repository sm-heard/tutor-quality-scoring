"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type ReliabilityPoint = {
  label: string
  noShowRate: number
  rescheduleRate: number
  firstSessionFailureRate: number
}

type ReliabilityAreaChartProps = {
  data: ReliabilityPoint[]
  interval: number
  decimals?: number
}

export function ReliabilityAreaChart({
  data,
  interval,
  decimals = 0,
}: ReliabilityAreaChartProps) {
  const formatValue = (value: number) => `${(value * 100).toFixed(decimals)}%`

  return (
    <ChartContainer
      config={{
        noShowRate: { label: "No-show", color: "#ef4444" },
        rescheduleRate: { label: "Reschedule", color: "#f59e0b" },
        firstSessionFailureRate: { label: "First-session fail", color: "#8b5cf6" },
      }}
    >
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gradientNoShow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradientReschedule" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradientFirstFail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="1 3" stroke="rgba(6, 182, 212, 0.1)" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={interval}
          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
        />
        <YAxis
          tickFormatter={formatValue}
          width={48}
          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip
          cursor={{ stroke: '#06b6d4', strokeWidth: 1, strokeDasharray: '4 4' }}
          content={<ChartTooltipContent />}
        />
        <Area
          dataKey="noShowRate"
          type="monotone"
          stroke="#ef4444"
          fill="url(#gradientNoShow)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, fill: '#ef4444', stroke: '#0a0e17' }}
        />
        <Area
          dataKey="rescheduleRate"
          type="monotone"
          stroke="#f59e0b"
          fill="url(#gradientReschedule)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, fill: '#f59e0b', stroke: '#0a0e17' }}
        />
        <Area
          dataKey="firstSessionFailureRate"
          type="monotone"
          stroke="#8b5cf6"
          fill="url(#gradientFirstFail)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, fill: '#8b5cf6', stroke: '#0a0e17' }}
        />
      </AreaChart>
    </ChartContainer>
  )
}
