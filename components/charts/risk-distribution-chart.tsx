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
    <ChartContainer config={{ count: { label: "Tutors", color: "#6366F1" } }}>
      <BarChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} width={36} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((bucket) => (
            <Cell key={bucket.band} fill={bucket.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

