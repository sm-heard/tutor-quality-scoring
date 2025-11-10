import { subDays } from "date-fns"
import { and, asc, between, desc, eq, gte, sql } from "drizzle-orm"

import type { RiskBandId } from "@/lib/constants"
import { db, schema } from "@/lib/db"
import { fromDateKey, toDateKey } from "@/lib/date"
import { type ScoreDriverId, determineRiskBand } from "@/lib/scoring"

type MetricPoint = {
  date: string
  score: number
  noShowRate: number
  rescheduleRate: number
  firstSessionFailureRate: number
  averageRating: number
  sessions: number
}

type SessionRow = {
  id: string
  startAt: Date
  studentId: string
  firstSession: boolean
  rating: number | null
  rescheduled: boolean
  noShow: boolean
}

export type TutorDetail = {
  tutorId: string
  name: string
  cohort: string
  riskBand: RiskBandId
  score: number
  drivers: ScoreDriverId[]
  sessions30d: number
  noShowRate30d: number
  rescheduleRate30d: number
  firstSessionFailureRate30d: number
  averageRating30d: number
  trend: MetricPoint[]
  latestSessions: SessionRow[]
}

function safeNumber(value: unknown) {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function rate(numerator: number, denominator: number) {
  if (!denominator) return 0
  return numerator / denominator
}

async function getLatestDateKeyForTutor(tutorId: string) {
  const [row] = await db
    .select({ maxDate: sql<string>`max(${schema.tutorDailyMetrics.date})` })
    .from(schema.tutorDailyMetrics)
    .where(eq(schema.tutorDailyMetrics.tutorId, tutorId))
    .limit(1)

  return row?.maxDate ?? toDateKey(new Date())
}

export async function getTutorDetail(tutorId: string, rangeDays = 60) {
  const tutor = await db.query.tutors.findFirst({
    where: eq(schema.tutors.id, tutorId),
  })

  if (!tutor) {
    return null
  }

  const toKey = await getLatestDateKeyForTutor(tutorId)
  const toDate = fromDateKey(toKey)
  const fromDate = subDays(toDate, rangeDays - 1)
  const fromKey = toDateKey(fromDate)
  const from30Key = toDateKey(subDays(toDate, 29))

  const [latestRow] = await db
    .select({
      score: schema.tutorDailyMetrics.score,
      drivers: schema.tutorDailyMetrics.drivers,
      trailingNoShowRate: schema.tutorDailyMetrics.trailingNoShowRate,
      trailingRescheduleRate: schema.tutorDailyMetrics.trailingRescheduleRate,
      trailingFirstSessionFailRate:
        schema.tutorDailyMetrics.trailingFirstSessionFailRate,
      trailingAverageRating: schema.tutorDailyMetrics.trailingAverageRating,
      trailing7NoShowRate: schema.tutorDailyMetrics.trailing7NoShowRate,
      trailing7RescheduleRate: schema.tutorDailyMetrics.trailing7RescheduleRate,
      trailing7FirstSessionFailRate:
        schema.tutorDailyMetrics.trailing7FirstSessionFailRate,
      trailing7AverageRating: schema.tutorDailyMetrics.trailing7AverageRating,
    })
    .from(schema.tutorDailyMetrics)
    .where(
      and(
        eq(schema.tutorDailyMetrics.tutorId, tutorId),
        eq(schema.tutorDailyMetrics.date, toKey)
      )
    )
    .limit(1)

  const [aggregate30] = await db
    .select({
      sessions: sql<number>`sum(${schema.tutorDailyMetrics.sessionsCount})`,
      noShows: sql<number>`sum(${schema.tutorDailyMetrics.noShows})`,
      reschedules: sql<number>`sum(${schema.tutorDailyMetrics.reschedules})`,
      firstSessions: sql<number>`sum(${schema.tutorDailyMetrics.firstSessions})`,
      firstSessionFailures: sql<number>`sum(${schema.tutorDailyMetrics.firstSessionFailures})`,
      ratingSum: sql<number>`sum(${schema.tutorDailyMetrics.ratingSum})`,
      ratingCount: sql<number>`sum(${schema.tutorDailyMetrics.ratingCount})`,
    })
    .from(schema.tutorDailyMetrics)
    .where(
      and(
        eq(schema.tutorDailyMetrics.tutorId, tutorId),
        between(schema.tutorDailyMetrics.date, from30Key, toKey)
      )
    )

  const metrics = await db
    .select({
      date: schema.tutorDailyMetrics.date,
      score: schema.tutorDailyMetrics.score,
      noShowRate: schema.tutorDailyMetrics.trailingNoShowRate,
      rescheduleRate: schema.tutorDailyMetrics.trailingRescheduleRate,
      firstSessionFailureRate:
        schema.tutorDailyMetrics.trailingFirstSessionFailRate,
      averageRating: schema.tutorDailyMetrics.trailingAverageRating,
      sessions: schema.tutorDailyMetrics.sessionsCount,
    })
    .from(schema.tutorDailyMetrics)
    .where(
      and(
        eq(schema.tutorDailyMetrics.tutorId, tutorId),
        between(schema.tutorDailyMetrics.date, fromKey, toKey)
      )
    )
    .orderBy(asc(schema.tutorDailyMetrics.date))

  const trend: MetricPoint[] = metrics.map((row) => ({
    date: row.date,
    score: safeNumber(row.score),
    noShowRate: safeNumber(row.noShowRate),
    rescheduleRate: safeNumber(row.rescheduleRate),
    firstSessionFailureRate: safeNumber(row.firstSessionFailureRate),
    averageRating: safeNumber(row.averageRating),
    sessions: safeNumber(row.sessions),
  }))

  const sessionsRows = await db
    .select({
      id: schema.sessions.id,
      startAt: schema.sessions.startAt,
      studentId: schema.sessions.studentId,
      firstSession: schema.sessions.firstSession,
      rating: schema.sessions.rating,
      rescheduled: schema.sessions.rescheduled,
      noShow: schema.sessions.noShow,
    })
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.tutorId, tutorId),
        gte(schema.sessions.startAt, subDays(toDate, 29))
      )
    )
    .orderBy(desc(schema.sessions.startAt))
    .limit(25)

  const latestSessions: SessionRow[] = sessionsRows.map((row) => {
    const startAt =
      row.startAt instanceof Date
        ? row.startAt
        : new Date(Number(row.startAt))

    return {
      id: row.id,
      startAt,
      studentId: row.studentId,
      firstSession: !!row.firstSession,
      rating: row.rating ?? null,
      rescheduled: !!row.rescheduled,
      noShow: !!row.noShow,
    }
  })

  const drivers: ScoreDriverId[] = (() => {
    try {
      const parsed = JSON.parse(latestRow?.drivers as unknown as string)
      return Array.isArray(parsed) ? (parsed as ScoreDriverId[]) : []
    } catch {
      return []
    }
  })()

  const score = safeNumber(latestRow?.score)
  const sessions30d = safeNumber(aggregate30?.sessions)
  const noShows30d = safeNumber(aggregate30?.noShows)
  const reschedules30d = safeNumber(aggregate30?.reschedules)
  const firstSessions30d = safeNumber(aggregate30?.firstSessions)
  const firstSessionFailures30d = safeNumber(
    aggregate30?.firstSessionFailures
  )
  const ratingSum30d = safeNumber(aggregate30?.ratingSum)
  const ratingCount30d = safeNumber(aggregate30?.ratingCount)

  return {
    tutorId: tutor.id,
    name: tutor.name,
    cohort: tutor.cohort,
    riskBand: determineRiskBand(score),
    score,
    drivers,
    sessions30d,
    noShowRate30d: rate(noShows30d, sessions30d),
    rescheduleRate30d: rate(reschedules30d, sessions30d),
    firstSessionFailureRate30d: rate(
      firstSessionFailures30d,
      firstSessions30d
    ),
    averageRating30d: rate(ratingSum30d, ratingCount30d),
    trend,
    latestSessions,
  }
}
