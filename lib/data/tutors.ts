import { subDays } from "date-fns"
import { between, eq, sql } from "drizzle-orm"

import type { RiskBandId } from "@/lib/constants"
import { db, schema } from "@/lib/db"
import { fromDateKey, toDateKey } from "@/lib/date"
import {
  type ScoreDriverId,
  determineRiskBand,
} from "@/lib/scoring"

export type TutorListItem = {
  tutorId: string
  name: string
  cohort: string
  score: number
  riskBand: RiskBandId
  drivers: ScoreDriverId[]
  sessions30d: number
  noShowRate30d: number
  rescheduleRate30d: number
  firstSessionFailureRate30d: number
  averageRating30d: number
  noShowRate7d: number
  rescheduleRate7d: number
  firstSessionFailureRate7d: number
  averageRating7d: number
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

async function getLatestDateKey() {
  const [row] = await db
    .select({ maxDate: sql<string>`max(${schema.tutorDailyMetrics.date})` })
    .from(schema.tutorDailyMetrics)
    .limit(1)

  return row?.maxDate ?? toDateKey(new Date())
}

export async function getTutorList(rangeDays = 30) {
  const toKey = await getLatestDateKey()
  const toDate = fromDateKey(toKey)
  const fromDate = subDays(toDate, rangeDays - 1)
  const fromKey = toDateKey(fromDate)

  const latestRows = await db
    .select({
      tutorId: schema.tutorDailyMetrics.tutorId,
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
    .where(eq(schema.tutorDailyMetrics.date, toKey))

  const aggregates = await db
    .select({
      tutorId: schema.tutorDailyMetrics.tutorId,
      name: schema.tutors.name,
      cohort: schema.tutors.cohort,
      sessions: sql<number>`sum(${schema.tutorDailyMetrics.sessionsCount})`,
      noShows: sql<number>`sum(${schema.tutorDailyMetrics.noShows})`,
      reschedules: sql<number>`sum(${schema.tutorDailyMetrics.reschedules})`,
      firstSessions: sql<number>`sum(${schema.tutorDailyMetrics.firstSessions})`,
      firstSessionFailures: sql<number>`sum(${schema.tutorDailyMetrics.firstSessionFailures})`,
      ratingSum: sql<number>`sum(${schema.tutorDailyMetrics.ratingSum})`,
      ratingCount: sql<number>`sum(${schema.tutorDailyMetrics.ratingCount})`,
    })
    .from(schema.tutorDailyMetrics)
    .innerJoin(
      schema.tutors,
      eq(schema.tutorDailyMetrics.tutorId, schema.tutors.id)
    )
    .where(between(schema.tutorDailyMetrics.date, fromKey, toKey))
    .groupBy(
      schema.tutorDailyMetrics.tutorId,
      schema.tutors.name,
      schema.tutors.cohort
    )

  const latestMap = new Map<string, (typeof latestRows)[number]>()
  for (const row of latestRows) {
    latestMap.set(row.tutorId, row)
  }

  const list: TutorListItem[] = []

  for (const row of aggregates) {
    const latest = latestMap.get(row.tutorId)
    if (!latest) continue

    const sessions = safeNumber(row.sessions)
    const noShows = safeNumber(row.noShows)
    const reschedules = safeNumber(row.reschedules)
    const firstSessions = safeNumber(row.firstSessions)
    const firstSessionFailures = safeNumber(row.firstSessionFailures)
    const ratingSum = safeNumber(row.ratingSum)
    const ratingCount = safeNumber(row.ratingCount)

    const drivers: ScoreDriverId[] = (() => {
      try {
        const parsed = JSON.parse(latest.drivers as unknown as string)
        return Array.isArray(parsed) ? (parsed as ScoreDriverId[]) : []
      } catch {
        return []
      }
    })()

    const score = safeNumber(latest.score)
    list.push({
      tutorId: row.tutorId,
      name: row.name,
      cohort: row.cohort,
      score,
      riskBand: determineRiskBand(score),
      drivers,
      sessions30d: sessions,
      noShowRate30d: rate(noShows, sessions),
      rescheduleRate30d: rate(reschedules, sessions),
      firstSessionFailureRate30d: rate(firstSessionFailures, firstSessions),
      averageRating30d: rate(ratingSum, ratingCount),
      noShowRate7d: safeNumber(latest.trailing7NoShowRate),
      rescheduleRate7d: safeNumber(latest.trailing7RescheduleRate),
      firstSessionFailureRate7d: safeNumber(
        latest.trailing7FirstSessionFailRate
      ),
      averageRating7d: safeNumber(latest.trailing7AverageRating),
    })
  }

  list.sort((a, b) => a.name.localeCompare(b.name))

  return list
}
