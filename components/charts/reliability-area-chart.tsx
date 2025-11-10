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
        noShowRate: { label: "No-show", color: "#D64545" },
        rescheduleRate: { label: "Reschedule", color: "#F2BF49" },
        firstSessionFailureRate: { label: "First-session fail", color: "#7C5E99" },
      }}
    >
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={interval} />
        <YAxis tickFormatter={formatValue} width={48} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Area
          dataKey="noShowRate"
          type="monotone"
          stroke="var(--color-noShowRate)"
          fill="var(--color-noShowRate)"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Area
          dataKey="rescheduleRate"
          type="monotone"
          stroke="var(--color-rescheduleRate)"
          fill="var(--color-rescheduleRate)"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Area
          dataKey="firstSessionFailureRate"
          type="monotone"
          stroke="var(--color-firstSessionFailureRate)"
          fill="var(--color-firstSessionFailureRate)"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
