import { randomUUID } from "node:crypto"

import { faker } from "@faker-js/faker"
import type { SQLiteTable } from "drizzle-orm/sqlite-core"
import { addMinutes, startOfDay, subDays } from "date-fns"

import { buildTutorDailyMetrics } from "@/lib/aggregation"
import { db, schema } from "@/lib/db"

type TutorProfile = {
  tutor: typeof schema.tutors.$inferInsert
  baseSessions: number
  baseNoShowRate: number
  baseRescheduleRate: number
  baseFirstSessionFailRate: number
  ratingMean: number
  ratingStd: number
}

type SessionInsert = typeof schema.sessions.$inferInsert

type StudentInsert = typeof schema.students.$inferInsert

const TUTOR_COUNT = 140
const DAYS = 60
const FIRST_SESSION_PROBABILITY = 0.22

const COHORTS = ["STEM", "Humanities", "Test Prep", "Languages", "K12"]
const STUDENT_COHORTS = ["HS", "College", "Adult"]

function boxMuller(mean: number, stdDev: number) {
  let u = 0
  let v = 0

  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()

  const magnitude = Math.sqrt(-2.0 * Math.log(u))
  const angle = 2.0 * Math.PI * v

  return mean + stdDev * magnitude * Math.cos(angle)
}

function clampRating(value: number) {
  return Math.max(1, Math.min(5, Number(value.toFixed(1))))
}

function probabilityAdjust(base: number, modifier: number) {
  const value = base * modifier
  return Math.min(Math.max(value, 0), 0.95)
}

function pick<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)]
}

async function main() {
  faker.seed(42)

  console.log("Seeding database...")

  db.transaction((tx) => {
    tx.delete(schema.tutorDailyMetrics).run()
    tx.delete(schema.sessions).run()
    tx.delete(schema.students).run()
    tx.delete(schema.tutors).run()
  })

  const tutorProfiles: TutorProfile[] = []

  for (let i = 0; i < TUTOR_COUNT; i++) {
    const ratingMid = faker.number.float({ min: 3.6, max: 4.6, fractionDigits: 2 })
    tutorProfiles.push({
      tutor: {
        id: `tutor_${i + 1}`,
        name: faker.person.fullName(),
        cohort: pick(COHORTS),
        active: true,
        createdAt: faker.date.past({ years: 1 }),
      },
      baseSessions: faker.number.int({ min: 18, max: 26 }),
      baseNoShowRate: faker.number.float({ min: 0.05, max: 0.11, fractionDigits: 3 }),
      baseRescheduleRate: faker.number.float({
        min: 0.09,
        max: 0.19,
        fractionDigits: 3,
      }),
      baseFirstSessionFailRate: faker.number.float({
        min: 0.12,
        max: 0.22,
        fractionDigits: 3,
      }),
      ratingMean: ratingMid,
      ratingStd: faker.number.float({ min: 0.25, max: 0.45, fractionDigits: 2 }),
    })
  }

  const students: StudentInsert[] = []
  const sessions: SessionInsert[] = []
  const rawSessions: Parameters<typeof buildTutorDailyMetrics>[0] = []

  const studentPool = new Map<string, string[]>()
  let studentCounter = 1

  const today = startOfDay(new Date())

  for (let dayOffset = 0; dayOffset < DAYS; dayOffset++) {
    const day = subDays(today, dayOffset)
    const weekday = day.getDay()
    const dayFactor = weekday === 0 ? 0.55 : weekday === 6 ? 0.72 : 1

    for (const profile of tutorProfiles) {
      const noise = faker.number.int({ min: -4, max: 6 })
      const baseCount = Math.max(
        0,
        Math.round((profile.baseSessions + noise) * dayFactor)
      )

      if (baseCount === 0) continue

      const tutorStudentPool = studentPool.get(profile.tutor.id) || []

      for (let i = 0; i < baseCount; i++) {
        const sessionStartMinute = faker.number.int({ min: 8 * 60, max: 21 * 60 })
        const startAt = addMinutes(day, sessionStartMinute)
        const endAt = addMinutes(startAt, faker.number.int({ min: 45, max: 75 }))

        const isFirstSession =
          tutorStudentPool.length === 0
            ? true
            : Math.random() < FIRST_SESSION_PROBABILITY

        let studentId: string

        if (isFirstSession || tutorStudentPool.length === 0) {
          studentId = `student_${studentCounter++}`
          tutorStudentPool.push(studentId)
          students.push({
            id: studentId,
            cohort: pick(STUDENT_COHORTS),
            createdAt: faker.date.past({ years: 1 }),
          })
        } else {
          studentId = pick(tutorStudentPool)
        }

        studentPool.set(profile.tutor.id, tutorStudentPool)

        const timeOfDayModifier = sessionStartMinute >= 20 * 60 ? 1.2 : 1
        const weekendModifier = weekday === 5 || weekday === 6 ? 1.1 : 1

        const noShowProbability = probabilityAdjust(
          profile.baseNoShowRate,
          timeOfDayModifier * weekendModifier
        )

        const rescheduleProbability = probabilityAdjust(
          profile.baseRescheduleRate,
          weekday === 1 || weekday === 5 ? 1.15 : 1
        )

        const firstSessionFailProbability = probabilityAdjust(
          profile.baseFirstSessionFailRate,
          isFirstSession ? 1.15 : 0.85
        )

        const isNoShow = Math.random() < noShowProbability
        const isRescheduled = !isNoShow && Math.random() < rescheduleProbability

        let rating: number | null = null

        if (!isNoShow) {
          const rawRating = clampRating(
            boxMuller(profile.ratingMean, profile.ratingStd)
          )
          const adjusted = isFirstSession
            ? rawRating - faker.number.float({ min: 0, max: 0.5 })
            : rawRating
          rating = clampRating(adjusted)

          const fail = Math.random() < firstSessionFailProbability
          if (fail && rating >= 3) {
            rating = clampRating(rating - faker.number.float({ min: 0.5, max: 1.2 }))
          }
        }

        const sessionId = randomUUID()

        const session: SessionInsert = {
          id: sessionId,
          tutorId: profile.tutor.id,
          studentId,
          startAt,
          endAt,
          firstSession: isFirstSession,
          rating: rating !== null ? Math.round(rating) : null,
          rescheduled: isRescheduled,
          noShow: isNoShow,
        }

        sessions.push(session)
        rawSessions.push({
          id: sessionId,
          tutorId: profile.tutor.id,
          studentId,
          startAt,
          endAt,
          firstSession: isFirstSession,
          rating: session.rating ?? null,
          rescheduled: isRescheduled,
          noShow: isNoShow,
        })
      }
    }
  }

  console.log(
    `Generated ${tutorProfiles.length} tutors, ${students.length} students, ${sessions.length} sessions.`
  )

  const dailyMetrics = buildTutorDailyMetrics(rawSessions)

  db.transaction((tx) => {
    insertChunks(tx, schema.tutors, tutorProfiles.map((t) => t.tutor))
    insertChunks(tx, schema.students, students)
    insertChunks(tx, schema.sessions, sessions)
    insertChunks(tx, schema.tutorDailyMetrics, dailyMetrics)
  })

  console.log("Seeding complete.")
}

function insertChunks<TTable extends SQLiteTable, TRow extends Record<string, unknown>>(
  tx: Pick<typeof db, "insert">,
  table: TTable,
  rows: TRow[],
  chunkSize = 200
) {
  if (!rows.length) return

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    tx.insert(table).values(chunk).run()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
