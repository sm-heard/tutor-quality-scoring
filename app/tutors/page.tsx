import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { getTutorList } from "@/lib/data/tutors"
import { SCORE_DRIVERS } from "@/lib/scoring"

import { TutorFilters } from "@/components/tutor-filters"

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

type TutorsPageProps = {
  searchParams?: Promise<{
    risk?: string
    cohort?: string
  }>
}

export default async function TutorsPage(props: TutorsPageProps) {
  const searchParams = (await props.searchParams) ?? {}
  const tutors = await getTutorList(30)

  const cohorts = Array.from(new Set(tutors.map((tutor) => tutor.cohort))).sort()
  const riskOptions = RISK_BANDS.map((band) => ({
    value: band.id,
    label: `${band.label} risk`,
  }))

  const filtered = tutors.filter((tutor) => {
    if (searchParams.risk && tutor.riskBand !== searchParams.risk) {
      return false
    }
    if (searchParams.cohort && tutor.cohort !== searchParams.cohort) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/20 rounded-full" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tutor Registry</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Comprehensive performance metrics, reliability scores, and intervention signals
            </p>
          </div>
        </div>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
        <CardHeader className="flex flex-col gap-4 border-b border-border/50 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="w-1 h-5 bg-primary rounded-full" />
              Filter & Export
            </CardTitle>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {filtered.length} OF {tutors.length} TUTORS
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TutorFilters
              cohorts={cohorts.map((value) => ({ value, label: value }))}
              riskBands={riskOptions}
            />
            <Button asChild variant="outline" size="sm" className="border-primary/30 hover:border-primary/50 hover:bg-primary/10">
              <Link href="/api/export/tutors.csv?range=30">Export CSV</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-[220px] font-mono text-[10px] uppercase tracking-wider">Tutor</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider">Score</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider">No-show (30d)</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider">Reschedule (30d)</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider">First-fail (30d)</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider">Rating</TableHead>
                <TableHead className="hidden lg:table-cell font-mono text-[10px] uppercase tracking-wider">Drivers</TableHead>
                <TableHead className="text-right font-mono text-[10px] uppercase tracking-wider">Sessions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tutor) => (
                <TableRow key={tutor.tutorId} className="border-border/50 hover:bg-muted/30 transition-colors group">
                  <TableCell className="whitespace-nowrap">
                    <div className="space-y-1">
                      <Link
                        href={`/tutors/${tutor.tutorId}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-2 group-hover:gap-3 duration-200"
                      >
                        <span>{tutor.name}</span>
                        <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                        {tutor.cohort}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold tabular-nums text-lg">{tutor.score.toFixed(1)}</span>
                      <Badge className={`${getRiskAccent(tutor.riskBand)} font-mono text-[10px]`} variant="outline">
                        {tutor.riskBand.toUpperCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold tabular-nums text-destructive">
                        {formatPercent(tutor.noShowRate30d)}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        7d: {formatPercent(tutor.noShowRate7d)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold tabular-nums text-accent">
                        {formatPercent(tutor.rescheduleRate30d)}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        7d: {formatPercent(tutor.rescheduleRate7d)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold tabular-nums text-destructive">
                        {formatPercent(tutor.firstSessionFailureRate30d)}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        7d: {formatPercent(tutor.firstSessionFailureRate7d)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold tabular-nums">
                        {tutor.averageRating30d.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        7d: {tutor.averageRating7d.toFixed(2)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-sm lg:table-cell text-xs">
                    <div className="flex flex-wrap gap-1">
                      {tutor.drivers.length
                        ? tutor.drivers.map((driver) => (
                            <span key={driver} className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/50 border border-border/50 font-mono text-[10px] text-muted-foreground">
                              {SCORE_DRIVERS[driver] ?? driver}
                            </span>
                          ))
                        : <span className="text-primary font-mono text-[10px]">Balanced</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums">
                    {tutor.sessions30d.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!filtered.length && (
            <div className="py-16 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground font-mono">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                No tutors match the current filters
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getRiskAccent(bandId: string) {
  const band = RISK_BANDS.find((item) => item.id === bandId)
  return band?.accent ?? ""
}
