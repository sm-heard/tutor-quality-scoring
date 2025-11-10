import { NextResponse } from "next/server"

import { getSessionsList } from "@/lib/data/sessions"

function sanitizeDate(value: string | null, fallback: Date) {
  if (!value) return fallback
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return fallback
  return parsed
}

function parseBoolean(value: string | null) {
  if (value === "true") return true
  if (value === "false") return false
  return undefined
}

function toCsvField(value: unknown) {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsv(headers: string[], rows: (string | number | boolean | null)[][]) {
  const headerLine = headers.map(toCsvField).join(",")
  const body = rows.map((row) => row.map(toCsvField).join(",")).join("\n")
  return `${headerLine}\n${body}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const now = new Date()
  const from = sanitizeDate(searchParams.get("from"), new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000))
  const to = sanitizeDate(searchParams.get("to"), now)

  const sessions = await getSessionsList({
    from,
    to,
    tutorId: searchParams.get("tutorId") ?? undefined,
    firstSession: parseBoolean(searchParams.get("firstSession")),
    rescheduled: parseBoolean(searchParams.get("rescheduled")),
    noShow: parseBoolean(searchParams.get("noShow")),
    limit: 5000,
  })

  const headers = [
    "sessionId",
    "startAt",
    "tutorId",
    "tutorName",
    "cohort",
    "studentId",
    "firstSession",
    "rating",
    "rescheduled",
    "noShow",
  ]

  const rows = sessions.map((session) => [
    session.id,
    session.startAt.toISOString(),
    session.tutorId,
    session.tutorName,
    session.cohort,
    session.studentId,
    session.firstSession,
    session.rating ?? "",
    session.rescheduled,
    session.noShow,
  ])

  const csv = toCsv(headers, rows)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sessions.csv"`,
      "Cache-Control": "no-store",
    },
  })
}

