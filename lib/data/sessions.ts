import { and, between, eq, gte, lte, sql } from "drizzle-orm"

import { db, schema } from "@/lib/db"

export type SessionFilters = {
  from?: Date
  to?: Date
  tutorId?: string
  firstSession?: boolean
  rescheduled?: boolean
  noShow?: boolean
  limit?: number
}

export type SessionListItem = {
  id: string
  tutorId: string
  tutorName: string
  cohort: string
  startAt: Date
  studentId: string
  firstSession: boolean
  rating: number | null
  rescheduled: boolean
  noShow: boolean
}

export async function getSessionsList(filters: SessionFilters = {}) {
  const conditions = []

  if (filters.tutorId) {
    conditions.push(eq(schema.sessions.tutorId, filters.tutorId))
  }

  if (filters.firstSession !== undefined) {
    conditions.push(eq(schema.sessions.firstSession, filters.firstSession))
  }

  if (filters.rescheduled !== undefined) {
    conditions.push(eq(schema.sessions.rescheduled, filters.rescheduled))
  }

  if (filters.noShow !== undefined) {
    conditions.push(eq(schema.sessions.noShow, filters.noShow))
  }

  if (filters.from && filters.to) {
    conditions.push(
      between(schema.sessions.startAt, filters.from, filters.to)
    )
  } else if (filters.from) {
    conditions.push(gte(schema.sessions.startAt, filters.from))
  } else if (filters.to) {
    conditions.push(lte(schema.sessions.startAt, filters.to))
  }

  const whereClause =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions)

  const rows = await db
    .select({
      id: schema.sessions.id,
      tutorId: schema.sessions.tutorId,
      tutorName: schema.tutors.name,
      cohort: schema.tutors.cohort,
      startAt: schema.sessions.startAt,
      studentId: schema.sessions.studentId,
      firstSession: schema.sessions.firstSession,
      rating: schema.sessions.rating,
      rescheduled: schema.sessions.rescheduled,
      noShow: schema.sessions.noShow,
    })
    .from(schema.sessions)
    .innerJoin(schema.tutors, eq(schema.sessions.tutorId, schema.tutors.id))
    .where(whereClause)
    .orderBy(sql`${schema.sessions.startAt} DESC`)
    .limit(filters.limit ?? 100)

  return rows.map((row) => ({
    id: row.id,
    tutorId: row.tutorId,
    tutorName: row.tutorName,
    cohort: row.cohort,
    startAt:
      row.startAt instanceof Date ? row.startAt : new Date(Number(row.startAt)),
    studentId: row.studentId,
    firstSession: !!row.firstSession,
    rating: row.rating ?? null,
    rescheduled: !!row.rescheduled,
    noShow: !!row.noShow,
  }))
}
