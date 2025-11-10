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
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Tutors</h1>
        <p className="text-sm text-muted-foreground">
          Explore tutor performance, reliability, and first-session outcomes. Click a row for full detail.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base font-semibold">Filters</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <TutorFilters
              cohorts={cohorts.map((value) => ({ value, label: value }))}
              riskBands={riskOptions}
            />
            <Button asChild variant="outline" size="sm">
              <Link href="/api/export/tutors.csv?range=30">Export CSV</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Tutor</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>No-show (30d)</TableHead>
                <TableHead>Reschedule (30d)</TableHead>
                <TableHead>First-session fail (30d)</TableHead>
                <TableHead>Avg rating</TableHead>
                <TableHead className="hidden lg:table-cell">Drivers</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tutor) => (
                <TableRow key={tutor.tutorId} className="hover:bg-muted/40">
                  <TableCell className="whitespace-nowrap">
                    <div className="space-y-1">
                      <Link
                        href={`/tutors/${tutor.tutorId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {tutor.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {tutor.cohort}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{tutor.score.toFixed(1)}</span>
                      <Badge className={getRiskAccent(tutor.riskBand)} variant="outline">
                        {tutor.riskBand.toUpperCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {formatPercent(tutor.noShowRate30d)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      7d: {formatPercent(tutor.noShowRate7d)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {formatPercent(tutor.rescheduleRate30d)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      7d: {formatPercent(tutor.rescheduleRate7d)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {formatPercent(tutor.firstSessionFailureRate30d)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      7d: {formatPercent(tutor.firstSessionFailureRate7d)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {tutor.averageRating30d.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      7d: {tutor.averageRating7d.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-sm lg:table-cell text-xs text-muted-foreground">
                    {tutor.drivers.length
                      ? tutor.drivers
                          .map((driver) => SCORE_DRIVERS[driver] ?? driver)
                          .join(" · ")
                      : "Balanced"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {tutor.sessions30d.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!filtered.length && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No tutors match the current filters.
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
