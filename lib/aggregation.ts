import { differenceInCalendarDays, startOfDay } from "date-fns"

import type { TutorDailyMetric } from "@/lib/db/schema"
import { tutorDailyMetrics } from "@/lib/db/schema"
import { calculateCompositeScore } from "@/lib/scoring"

import { toDateKey } from "./date"

type SessionRecord = {
  id: string
  tutorId: string
  studentId: string
  startAt: Date
  endAt: Date
  firstSession: boolean
  rating: number | null
  rescheduled: boolean
  noShow: boolean
}

type DailyEntry = {
  tutorId: string
  date: string
  day: Date
  sessionsCount: number
  firstSessions: number
  firstSessionFailures: number
  reschedules: number
  noShows: number
  ratingSum: number
  ratingCount: number
}

type Totals = {
  sessions: number
  firstSessions: number
  firstSessionFailures: number
  reschedules: number
  noShows: number
  ratingSum: number
  ratingCount: number
}

const DEFAULT_TOTALS = (): Totals => ({
  sessions: 0,
  firstSessions: 0,
  firstSessionFailures: 0,
  reschedules: 0,
  noShows: 0,
  ratingSum: 0,
  ratingCount: 0,
})

export type TutorDailyMetricInsert = typeof tutorDailyMetrics.$inferInsert

function addTotals(target: Totals, entry: DailyEntry) {
  target.sessions += entry.sessionsCount
  target.firstSessions += entry.firstSessions
  target.firstSessionFailures += entry.firstSessionFailures
  target.reschedules += entry.reschedules
  target.noShows += entry.noShows
  target.ratingSum += entry.ratingSum
  target.ratingCount += entry.ratingCount
}

function subtractTotals(target: Totals, entry: DailyEntry) {
  target.sessions -= entry.sessionsCount
  target.firstSessions -= entry.firstSessions
  target.firstSessionFailures -= entry.firstSessionFailures
  target.reschedules -= entry.reschedules
  target.noShows -= entry.noShows
  target.ratingSum -= entry.ratingSum
  target.ratingCount -= entry.ratingCount
}

function computeRate(numerator: number, denominator: number) {
  if (!denominator) return 0
  return numerator / denominator
}

export function buildTutorDailyMetrics(
  sessions: SessionRecord[]
): TutorDailyMetricInsert[] {
  const tutorMap = new Map<string, Map<string, DailyEntry>>()

  for (const session of sessions) {
    const dayStart = startOfDay(session.startAt)
    const dateKey = toDateKey(dayStart)
    let byDay = tutorMap.get(session.tutorId)
    if (!byDay) {
      byDay = new Map()
      tutorMap.set(session.tutorId, byDay)
    }
    let entry = byDay.get(dateKey)
    if (!entry) {
      entry = {
        tutorId: session.tutorId,
        date: dateKey,
        day: dayStart,
        sessionsCount: 0,
        firstSessions: 0,
        firstSessionFailures: 0,
        reschedules: 0,
        noShows: 0,
        ratingSum: 0,
        ratingCount: 0,
      }
      byDay.set(dateKey, entry)
    }

    entry.sessionsCount += 1
    if (session.firstSession) {
      entry.firstSessions += 1
      const isFailure =
        session.noShow || (session.rating !== null && session.rating < 3)
      if (isFailure) {
        entry.firstSessionFailures += 1
      }
    }

    if (session.rescheduled) {
      entry.reschedules += 1
    }

    if (session.noShow) {
      entry.noShows += 1
    }

    if (session.rating !== null) {
      entry.ratingSum += session.rating
      entry.ratingCount += 1
    }
  }

  const inserts: TutorDailyMetricInsert[] = []

  for (const [tutorId, dailyMap] of tutorMap) {
    const entries = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    const window7: DailyEntry[] = []
    const window30: DailyEntry[] = []
    const totals7 = DEFAULT_TOTALS()
    const totals30 = DEFAULT_TOTALS()

    for (const entry of entries) {
      window7.push(entry)
      addTotals(totals7, entry)
      window30.push(entry)
      addTotals(totals30, entry)

      const entryDate = entry.day

      while (
        window7.length &&
        differenceInCalendarDays(entryDate, window7[0].day) >= 7
      ) {
        const removed = window7.shift()!
        subtractTotals(totals7, removed)
      }

      while (
        window30.length &&
        differenceInCalendarDays(entryDate, window30[0].day) >= 30
      ) {
        const removed = window30.shift()!
        subtractTotals(totals30, removed)
      }

      const firstSessionFailRate30 = computeRate(
        totals30.firstSessionFailures,
        totals30.firstSessions
      )

      const result = calculateCompositeScore({
        noShowRate: computeRate(totals30.noShows, totals30.sessions),
        rescheduleRate: computeRate(totals30.reschedules, totals30.sessions),
        firstSessionFailureRate: firstSessionFailRate30,
        averageRating: computeRate(totals30.ratingSum, totals30.ratingCount),
        sessionCount: totals30.sessions,
      })

      const dailyAverageRating = computeRate(
        entry.ratingSum,
        entry.ratingCount
      )

      inserts.push({
        tutorId,
        date: entry.date,
        sessionsCount: entry.sessionsCount,
        firstSessions: entry.firstSessions,
        firstSessionFailures: entry.firstSessionFailures,
        reschedules: entry.reschedules,
        noShows: entry.noShows,
        averageRating: Number(dailyAverageRating.toFixed(3)),
        ratingCount: entry.ratingCount,
        ratingSum: Number(entry.ratingSum.toFixed(3)),
        trailing7NoShowRate: Number(
          computeRate(totals7.noShows, totals7.sessions).toFixed(4)
        ),
        trailing7RescheduleRate: Number(
          computeRate(totals7.reschedules, totals7.sessions).toFixed(4)
        ),
        trailing7FirstSessionFailRate: Number(
          computeRate(
            totals7.firstSessionFailures,
            totals7.firstSessions
          ).toFixed(4)
        ),
        trailing7AverageRating: Number(
          computeRate(totals7.ratingSum, totals7.ratingCount).toFixed(3)
        ),
        trailingNoShowRate: Number(
          computeRate(totals30.noShows, totals30.sessions).toFixed(4)
        ),
        trailingRescheduleRate: Number(
          computeRate(totals30.reschedules, totals30.sessions).toFixed(4)
        ),
        trailingFirstSessionFailRate: Number(
          firstSessionFailRate30.toFixed(4)
        ),
        trailingAverageRating: Number(
          computeRate(totals30.ratingSum, totals30.ratingCount).toFixed(3)
        ),
        score: result.score,
        drivers: JSON.stringify(result.drivers),
      })
    }
  }

  return inserts
}

export function mergeDailyMetrics(
  existing: TutorDailyMetric[],
  incoming: TutorDailyMetricInsert[]
) {
  const map = new Map<string, TutorDailyMetric | TutorDailyMetricInsert>()

  for (const metric of existing) {
    map.set(`${metric.tutorId}-${metric.date}`, metric)
  }

  for (const metric of incoming) {
    map.set(`${metric.tutorId}-${metric.date}`, metric)
  }

  return Array.from(map.values())
}
