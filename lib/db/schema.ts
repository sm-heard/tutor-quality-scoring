import { sql } from "drizzle-orm"
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

export const tutors = sqliteTable(
  "tutors",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    cohort: text("cohort").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch('now'))`),
  },
  (table) => ({
    tutorCohortIdx: uniqueIndex("tutors_cohort_name_idx").on(
      table.cohort,
      table.name
    ),
  })
)

export const students = sqliteTable(
  "students",
  {
    id: text("id").primaryKey(),
    cohort: text("cohort").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch('now'))`),
  },
  (table) => ({
    studentCohortIdx: uniqueIndex("students_cohort_idx").on(
      table.cohort,
      table.id
    ),
  })
)

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  tutorId: text("tutor_id")
    .notNull()
    .references(() => tutors.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  startAt: integer("start_at", { mode: "timestamp" }).notNull(),
  endAt: integer("end_at", { mode: "timestamp" }).notNull(),
  firstSession: integer("first_session", { mode: "boolean" })
    .notNull()
    .default(false),
  rating: integer("rating"),
  rescheduled: integer("rescheduled", { mode: "boolean" })
    .notNull()
    .default(false),
  noShow: integer("no_show", { mode: "boolean" })
    .notNull()
    .default(false),
})

export const tutorDailyMetrics = sqliteTable(
  "tutor_daily_metrics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tutorId: text("tutor_id")
      .notNull()
      .references(() => tutors.id, { onDelete: "cascade" }),
    date: text("date")
      .notNull()
      .default(sql`(date('now'))`),
    sessionsCount: integer("sessions_count").notNull().default(0),
    firstSessions: integer("first_sessions").notNull().default(0),
    firstSessionFailures: integer("first_session_failures").notNull().default(0),
    reschedules: integer("reschedules").notNull().default(0),
    noShows: integer("no_shows").notNull().default(0),
    averageRating: real("average_rating").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    ratingSum: real("rating_sum").notNull().default(0),
    trailing7NoShowRate: real("trailing7_no_show_rate").notNull().default(0),
    trailing7RescheduleRate: real("trailing7_reschedule_rate").notNull().default(0),
    trailing7FirstSessionFailRate: real("trailing7_first_session_fail_rate")
      .notNull()
      .default(0),
    trailing7AverageRating: real("trailing7_average_rating").notNull().default(0),
    trailingNoShowRate: real("trailing_no_show_rate").notNull().default(0),
    trailingRescheduleRate: real("trailing_reschedule_rate")
      .notNull()
      .default(0),
    trailingFirstSessionFailRate: real("trailing_first_session_fail_rate")
      .notNull()
      .default(0),
    trailingAverageRating: real("trailing_average_rating").notNull().default(0),
    score: real("score").notNull().default(0),
    drivers: text("drivers").notNull().default("[]"),
  },
  (table) => ({
    tutorDateIdx: uniqueIndex("tutor_daily_metrics_tutor_date_idx").on(
      table.tutorId,
      table.date
    ),
  })
)

export type Tutor = typeof tutors.$inferSelect
export type Student = typeof students.$inferSelect
export type Session = typeof sessions.$inferSelect
export type TutorDailyMetric = typeof tutorDailyMetrics.$inferSelect
