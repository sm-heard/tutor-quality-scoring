import { subDays } from "date-fns"
import { asc, between, eq, sql } from "drizzle-orm"

import { RISK_BANDS, type RiskBandId } from "@/lib/constants"
import { db, schema } from "@/lib/db"
import { fromDateKey, toDateKey } from "@/lib/date"
import { type ScoreDriverId, determineRiskBand } from "@/lib/scoring"

export type TrendPoint = {
  date: string
  sessions: number
  noShowRate: number
  rescheduleRate: number
  firstSessionFailureRate: number
  averageRating: number
}

export type RiskDistributionBucket = {
  band: RiskBandId
  label: string
  color: string
  count: number
}

export type TopTutor = {
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
}

export type DashboardKpis = {
  noShowRate: number
  rescheduleRate: number
  firstSessionFailureRate: number
  averageRating: number
  totalSessions: number
}

export type DashboardData = {
  range: { from: string; to: string }
  kpis: DashboardKpis
  trends: TrendPoint[]
  riskDistribution: RiskDistributionBucket[]
  topTutors: TopTutor[]
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
    .select({
      maxDate: sql<string>`max(${schema.tutorDailyMetrics.date})`,
    })
    .from(schema.tutorDailyMetrics)
    .limit(1)

  return row?.maxDate ?? toDateKey(new Date())
}

export async function getDashboardData(
  rangeDays = 30
): Promise<DashboardData> {
  const toKey = await getLatestDateKey()
  const toDate = fromDateKey(toKey)
  const fromDate = subDays(toDate, rangeDays - 1)
  const fromKey = toDateKey(fromDate)

  const [totals] = await db
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
    .where(between(schema.tutorDailyMetrics.date, fromKey, toKey))

  const totalSessions = safeNumber(totals?.sessions)
  const totalNoShows = safeNumber(totals?.noShows)
  const totalReschedules = safeNumber(totals?.reschedules)
  const totalFirstSessions = safeNumber(totals?.firstSessions)
  const totalFirstSessionFailures = safeNumber(totals?.firstSessionFailures)
  const ratingSum = safeNumber(totals?.ratingSum)
  const ratingCount = safeNumber(totals?.ratingCount)

  const trends = await db
    .select({
      date: schema.tutorDailyMetrics.date,
      sessions: sql<number>`sum(${schema.tutorDailyMetrics.sessionsCount})`,
      noShows: sql<number>`sum(${schema.tutorDailyMetrics.noShows})`,
      reschedules: sql<number>`sum(${schema.tutorDailyMetrics.reschedules})`,
      firstSessions: sql<number>`sum(${schema.tutorDailyMetrics.firstSessions})`,
      firstSessionFailures: sql<number>`sum(${schema.tutorDailyMetrics.firstSessionFailures})`,
      ratingSum: sql<number>`sum(${schema.tutorDailyMetrics.ratingSum})`,
      ratingCount: sql<number>`sum(${schema.tutorDailyMetrics.ratingCount})`,
    })
    .from(schema.tutorDailyMetrics)
    .where(between(schema.tutorDailyMetrics.date, fromKey, toKey))
    .groupBy(schema.tutorDailyMetrics.date)
    .orderBy(asc(schema.tutorDailyMetrics.date))

  const trendPoints: TrendPoint[] = trends.map((row) => {
    const sessions = safeNumber(row.sessions)
    const noShows = safeNumber(row.noShows)
    const reschedules = safeNumber(row.reschedules)
    const firstSessions = safeNumber(row.firstSessions)
    const firstSessionFailures = safeNumber(row.firstSessionFailures)
    const ratingSumDay = safeNumber(row.ratingSum)
    const ratingCountDay = safeNumber(row.ratingCount)

    return {
      date: row.date,
      sessions,
      noShowRate: rate(noShows, sessions),
      rescheduleRate: rate(reschedules, sessions),
      firstSessionFailureRate: rate(firstSessionFailures, firstSessions),
      averageRating: rate(ratingSumDay, ratingCountDay),
    }
  })

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

  const tutorAggregates = await db
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

  const riskMap = new Map<RiskBandId, number>()
  for (const band of RISK_BANDS) {
    riskMap.set(band.id, 0)
  }

  const topTutors: TopTutor[] = []

  for (const row of tutorAggregates) {
    const latest = latestMap.get(row.tutorId)
    if (!latest) continue

    const score = safeNumber(latest.score)
    const drivers: ScoreDriverId[] = (() => {
      try {
        const parsed = JSON.parse(latest.drivers as unknown as string)
        return Array.isArray(parsed) ? (parsed as ScoreDriverId[]) : []
      } catch {
        return []
      }
    })()

    const band = determineRiskBand(score)
    riskMap.set(band, (riskMap.get(band) ?? 0) + 1)

    const sessions = safeNumber(row.sessions)
    const noShows = safeNumber(row.noShows)
    const reschedules = safeNumber(row.reschedules)
    const firstSessions = safeNumber(row.firstSessions)
    const firstSessionFailures = safeNumber(row.firstSessionFailures)
    const ratingSumTutor = safeNumber(row.ratingSum)
    const ratingCountTutor = safeNumber(row.ratingCount)

    topTutors.push({
      tutorId: row.tutorId,
      name: row.name,
      cohort: row.cohort,
      score,
      riskBand: band,
      drivers,
      sessions30d: sessions,
      noShowRate30d: rate(noShows, sessions),
      rescheduleRate30d: rate(reschedules, sessions),
      firstSessionFailureRate30d: rate(firstSessionFailures, firstSessions),
      averageRating30d: rate(ratingSumTutor, ratingCountTutor),
    })
  }

  topTutors.sort((a, b) => a.score - b.score)

  return {
    range: { from: fromKey, to: toKey },
    kpis: {
      noShowRate: rate(totalNoShows, totalSessions),
      rescheduleRate: rate(totalReschedules, totalSessions),
      firstSessionFailureRate: rate(
        totalFirstSessionFailures,
        totalFirstSessions
      ),
      averageRating: rate(ratingSum, ratingCount),
      totalSessions,
    },
    trends: trendPoints,
    riskDistribution: RISK_BANDS.map((bucket) => ({
      band: bucket.id,
      label: bucket.label,
      color: bucket.color,
      count: riskMap.get(bucket.id) ?? 0,
    })),
    topTutors: topTutors.slice(0, 10),
  }
}
