import { NextResponse } from "next/server"

import { getTutorList } from "@/lib/data/tutors"

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
  const rangeParam = searchParams.get("range")
  const rangeDays = Math.max(1, Math.min(60, Number(rangeParam ?? "30") || 30))

  const tutors = await getTutorList(rangeDays)

  const headers = [
    "tutorId",
    "name",
    "cohort",
    "score",
    "riskBand",
    "sessions30d",
    "noShowRate30d",
    "rescheduleRate30d",
    "firstSessionFailureRate30d",
    "averageRating30d",
    "drivers",
  ]

  const rows = tutors.map((tutor) => [
    tutor.tutorId,
    tutor.name,
    tutor.cohort,
    tutor.score.toFixed(1),
    tutor.riskBand,
    tutor.sessions30d,
    tutor.noShowRate30d.toFixed(4),
    tutor.rescheduleRate30d.toFixed(4),
    tutor.firstSessionFailureRate30d.toFixed(4),
    tutor.averageRating30d.toFixed(3),
    tutor.drivers.join(";"),
  ])

  const csv = toCsv(headers, rows)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tutors-${rangeDays}d.csv"`,
      "Cache-Control": "no-store",
    },
  })
}

