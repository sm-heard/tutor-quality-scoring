import { format } from "date-fns"

import { ReliabilityAreaChart } from "@/components/charts/reliability-area-chart"
import { RiskDistributionChart } from "@/components/charts/risk-distribution-chart"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RISK_BANDS } from "@/lib/constants"
import { getDashboardData } from "@/lib/data/dashboard"
import { SCORE_DRIVERS } from "@/lib/scoring"

function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`
}

function getRiskAccent(bandId: string) {
  const band = RISK_BANDS.find((item) => item.id === bandId)
  return band?.accent ?? ""
}

export default async function DashboardPage() {
  const data = await getDashboardData(30)

  const trendData = data.trends.map((point) => ({
    ...point,
    label: format(new Date(point.date), "MMM d"),
  }))

  const trendInterval = Math.max(1, Math.ceil(trendData.length / 6))

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/20 rounded-full" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time observatory for tutor performance metrics and intervention priorities
            </p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              No-show rate
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold tabular-nums text-destructive">
              {formatPercent(data.kpis.noShowRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              {data.kpis.totalSessions.toLocaleString()} sessions · 30d
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-all duration-500" />
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Reschedule rate
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold tabular-nums text-accent">
              {formatPercent(data.kpis.rescheduleRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              Tutor-initiated · 30d
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full blur-3xl group-hover:bg-destructive/10 transition-all duration-500" />
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              First-session fail
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold tabular-nums text-destructive">
              {formatPercent(data.kpis.firstSessionFailureRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              Rating &lt; 3 or no-show
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Average rating
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold tabular-nums text-primary">
              {data.kpis.averageRating.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              Trailing 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-primary/20 bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <CardTitle className="text-lg font-bold">
                Reliability Trends
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              30-DAY PERFORMANCE WINDOW
            </p>
          </CardHeader>
          <CardContent>
            <ReliabilityAreaChart
              data={trendData}
              interval={trendInterval}
              decimals={0}
            />
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/50 via-accent to-accent/50" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-accent rounded-full" />
              <CardTitle className="text-lg font-bold">
                Risk Distribution
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              COMPOSITE SCORE BANDS
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <RiskDistributionChart data={data.riskDistribution} />
            <div className="space-y-2.5">
              {data.riskDistribution.map((bucket) => (
                <div key={bucket.band} className="flex items-center justify-between text-sm group hover:bg-muted/30 -mx-2 px-2 py-1.5 rounded-md transition-colors">
                  <span className="font-medium">{bucket.label}</span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {bucket.count} tutor{bucket.count === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Tutors Table */}
      <Card className="border-destructive/30 bg-card/50 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive/50 via-destructive to-destructive/50" />
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-destructive rounded-full" />
            <CardTitle className="text-lg font-bold">
              Priority Interventions
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            HIGHEST RISK TUTORS · 30D TRAILING WINDOW
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-mono text-[10px] uppercase tracking-wider">Tutor</TableHead>
                <TableHead className="hidden sm:table-cell font-mono text-[10px] uppercase tracking-wider">Cohort</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider">Score</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider">No-show</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider">Reschedule</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider">First-fail</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider">Rating</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider">Drivers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topTutors.map((tutor, idx) => (
                <TableRow key={tutor.tutorId} className="border-border/50 hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                        <span className="text-[10px] font-bold font-mono text-destructive">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <span className="font-semibold">{tutor.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground font-mono text-xs">
                    {tutor.cohort}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold tabular-nums text-lg">{tutor.score.toFixed(1)}</span>
                      <Badge className={`${getRiskAccent(tutor.riskBand)} font-mono text-[10px]`} variant="outline">
                        {tutor.riskBand.toUpperCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums font-semibold text-destructive">{formatPercent(tutor.noShowRate30d)}</TableCell>
                  <TableCell className="tabular-nums font-semibold text-accent">{formatPercent(tutor.rescheduleRate30d)}</TableCell>
                  <TableCell className="tabular-nums font-semibold text-destructive">
                    {formatPercent(tutor.firstSessionFailureRate30d)}
                  </TableCell>
                  <TableCell className="tabular-nums font-semibold">{tutor.averageRating30d.toFixed(2)}</TableCell>
                  <TableCell className="max-w-xs text-xs text-muted-foreground">
                    <div className="flex flex-wrap gap-1">
                      {tutor.drivers.length
                        ? tutor.drivers.map((driver) => (
                            <span key={driver} className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/50 border border-border/50 font-mono text-[10px]">
                              {SCORE_DRIVERS[driver] ?? driver}
                            </span>
                          ))
                        : <span className="text-primary font-mono">Balanced</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
