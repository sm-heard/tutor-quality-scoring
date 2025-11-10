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
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Scaled view of tutor reliability, first-session health, and where to intervene next.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              No-show rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatPercent(data.kpis.noShowRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {data.kpis.totalSessions.toLocaleString()} sessions (30d)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reschedule rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatPercent(data.kpis.rescheduleRate)}
            </div>
            <p className="text-xs text-muted-foreground">Tutor-initiated (30d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              First-session failure rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatPercent(data.kpis.firstSessionFailureRate)}
            </div>
            <p className="text-xs text-muted-foreground">Ratings &lt; 3 or no-shows</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {data.kpis.averageRating.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Trailing 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              Reliability trends (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReliabilityAreaChart
              data={trendData}
              interval={trendInterval}
              decimals={0}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              Risk distribution
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Based on composite score bands
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <RiskDistributionChart data={data.riskDistribution} />
            <div className="space-y-2">
              {data.riskDistribution.map((bucket) => (
                <div key={bucket.band} className="flex items-center justify-between text-sm">
                  <span>{bucket.label}</span>
                  <span className="text-muted-foreground">
                    {bucket.count} tutor{bucket.count === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">
            Top at-risk tutors
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Lowest composite scores with drivers (30-day trailing window)
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tutor</TableHead>
                <TableHead className="hidden sm:table-cell">Cohort</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>No-show</TableHead>
                <TableHead>Reschedule</TableHead>
                <TableHead>First-session fail</TableHead>
                <TableHead>Avg rating</TableHead>
                <TableHead>Drivers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topTutors.map((tutor) => (
                <TableRow key={tutor.tutorId}>
                  <TableCell className="font-medium">{tutor.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {tutor.cohort}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{tutor.score.toFixed(1)}</span>
                      <Badge className={getRiskAccent(tutor.riskBand)} variant="outline">
                        {tutor.riskBand.toUpperCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{formatPercent(tutor.noShowRate30d)}</TableCell>
                  <TableCell>{formatPercent(tutor.rescheduleRate30d)}</TableCell>
                  <TableCell>
                    {formatPercent(tutor.firstSessionFailureRate30d)}
                  </TableCell>
                  <TableCell>{tutor.averageRating30d.toFixed(2)}</TableCell>
                  <TableCell className="max-w-xs whitespace-pre-wrap text-xs text-muted-foreground">
                    {tutor.drivers.length
                      ? tutor.drivers
                          .map((driver) => SCORE_DRIVERS[driver] ?? driver)
                          .join(" · ")
                      : "Balanced"}
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
