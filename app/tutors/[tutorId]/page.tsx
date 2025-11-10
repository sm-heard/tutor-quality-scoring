import { format } from "date-fns"

import { ReliabilityAreaChart } from "@/components/charts/reliability-area-chart"
import { ScoreLineChart } from "@/components/charts/score-line-chart"
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
import { getTutorDetail } from "@/lib/data/tutor-detail"
import { SCORE_DRIVERS } from "@/lib/scoring"
import { notFound } from "next/navigation"

function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`
}

type TutorDetailPageProps = {
  params: Promise<{ tutorId: string }>
}

export default async function TutorDetailPage(props: TutorDetailPageProps) {
  const params = await props.params
  const detail = await getTutorDetail(params.tutorId)

  if (!detail) {
    notFound()
  }

  const scoreTrend = detail.trend.map((point) => ({
    label: format(new Date(point.date), "MMM d"),
    score: point.score,
  }))

  const rateTrend = detail.trend.map((point) => ({
    label: format(new Date(point.date), "MMM d"),
    noShowRate: point.noShowRate,
    rescheduleRate: point.rescheduleRate,
    firstSessionFailureRate: point.firstSessionFailureRate,
  }))

  const scoreInterval = Math.max(1, Math.ceil(scoreTrend.length / 6))
  const rateInterval = Math.max(1, Math.ceil(rateTrend.length / 6))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{detail.name}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{detail.cohort}</span>
          <Badge className={getRiskAccent(detail.riskBand)} variant="outline">
            {detail.riskBand.toUpperCase()} risk
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Composite score" value={detail.score.toFixed(1)} />
        <MetricCard label="Sessions (30d)" value={detail.sessions30d.toLocaleString()} />
        <MetricCard label="No-show rate (30d)" value={formatPercent(detail.noShowRate30d)} />
        <MetricCard label="Avg rating (30d)" value={detail.averageRating30d.toFixed(2)} />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Score trend</CardTitle>
            <p className="text-xs text-muted-foreground">Daily composite score (last 60 days)</p>
          </div>
        </CardHeader>
        <CardContent>
          <ScoreLineChart data={scoreTrend} interval={scoreInterval} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Reliability trend</CardTitle>
            <p className="text-xs text-muted-foreground">Rates calculated on trailing windows</p>
          </div>
        </CardHeader>
        <CardContent>
          <ReliabilityAreaChart
            data={rateTrend}
            interval={rateInterval}
            decimals={0}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold">Drivers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-4">
          {detail.drivers.length ? (
            detail.drivers.map((driver) => (
              <Badge key={driver} variant="secondary">
                {SCORE_DRIVERS[driver] ?? driver}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No major drivers flagged.</span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold">Recent sessions</CardTitle>
          <p className="text-xs text-muted-foreground">Last 25 sessions (30-day window)</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>First session</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Rescheduled</TableHead>
                <TableHead>No-show</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.latestSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{format(session.startAt, "MMM d, yyyy")}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {session.studentId}
                  </TableCell>
                  <TableCell>{session.firstSession ? "Yes" : "No"}</TableCell>
                  <TableCell>{session.rating ?? "-"}</TableCell>
                  <TableCell>{session.rescheduled ? "Yes" : "No"}</TableCell>
                  <TableCell>{session.noShow ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}

function getRiskAccent(bandId: string) {
  const band = RISK_BANDS.find((item) => item.id === bandId)
  return band?.accent ?? ""
}
