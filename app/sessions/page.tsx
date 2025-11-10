import { subDays } from "date-fns"
import Link from "next/link"

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
import { db } from "@/lib/db"
import { getSessionsList } from "@/lib/data/sessions"

import { SessionFilters } from "@/components/session-filters"

type SessionsPageProps = {
  searchParams?: Promise<{
    from?: string
    to?: string
    tutorId?: string
    firstSession?: string
    rescheduled?: string
    noShow?: string
  }>
}

function sanitizeDate(value?: string, fallback?: Date) {
  if (!value) return fallback ?? new Date()
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return fallback ?? new Date()
  return parsed
}

export default async function SessionsPage(props: SessionsPageProps) {
  const searchParams = (await props.searchParams) ?? {}
  const today = new Date()
  const defaultFrom = subDays(today, 13)

  const fromDate = sanitizeDate(searchParams.from, defaultFrom)
  const toDate = sanitizeDate(searchParams.to, today)

  const [sessions, tutors] = await Promise.all([
    getSessionsList({
      from: fromDate,
      to: toDate,
      tutorId: searchParams.tutorId,
      firstSession:
        searchParams.firstSession === undefined || searchParams.firstSession === ""
          ? undefined
          : searchParams.firstSession === "true",
      rescheduled:
        searchParams.rescheduled === undefined || searchParams.rescheduled === ""
          ? undefined
          : searchParams.rescheduled === "true",
      noShow:
        searchParams.noShow === undefined || searchParams.noShow === ""
          ? undefined
          : searchParams.noShow === "true",
      limit: 200,
    }),
    db.query.tutors.findMany({
      columns: {
        id: true,
        name: true,
      },
      orderBy: (t, { asc }) => asc(t.name),
    }),
  ])

  const filterValues = {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
    tutorId: searchParams.tutorId ?? "",
    firstSession: searchParams.firstSession ?? "",
    rescheduled: searchParams.rescheduled ?? "",
    noShow: searchParams.noShow ?? "",
  }

  const exportParams = new URLSearchParams()
  exportParams.set("from", filterValues.from)
  exportParams.set("to", filterValues.to)
  if (filterValues.tutorId) exportParams.set("tutorId", filterValues.tutorId)
  if (filterValues.firstSession) exportParams.set("firstSession", filterValues.firstSession)
  if (filterValues.rescheduled) exportParams.set("rescheduled", filterValues.rescheduled)
  if (filterValues.noShow) exportParams.set("noShow", filterValues.noShow)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <p className="text-sm text-muted-foreground">
          Inspect recent sessions, highlight first-session experiences, and spot reschedule patterns.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base font-semibold">Filters</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href={`/api/export/sessions.csv?${exportParams.toString()}`}>
              Export CSV
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <SessionFilters tutors={tutors} values={filterValues} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold">
            Sessions ({sessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tutor</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>First session</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Rescheduled</TableHead>
                <TableHead>No-show</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.startAt.toLocaleString()}</TableCell>
                  <TableCell>
                    <Link
                      href={`/tutors/${session.tutorId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {session.tutorName}
                    </Link>
                    <div className="text-xs text-muted-foreground">{session.cohort}</div>
                  </TableCell>
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

          {!sessions.length && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No sessions match the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
