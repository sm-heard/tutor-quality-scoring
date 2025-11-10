"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type ScorePoint = {
  label: string
  score: number
}

type ScoreLineChartProps = {
  data: ScorePoint[]
  interval: number
}

export function ScoreLineChart({ data, interval }: ScoreLineChartProps) {
  return (
    <ChartContainer config={{ score: { label: "Score", color: "#2563EB" } }}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={interval} />
        <YAxis domain={[0, 100]} width={40} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="var(--color-score)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  )
}

