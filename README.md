# Tutor Quality Scoring — Simple Dashboard

Simple, explainable tutor performance dashboard using mocked data in SQLite. No auth, no testing, no ML.

## Stack
- Next.js (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Recharts (charts via shadcn patterns)
- Drizzle ORM + better‑sqlite3 (SQLite)

## Quick Start
1) Install deps
   - npm i

2) Configure (defaults are fine)
   - SQLite file at `.data/app.db` (auto-created by seed).

3) Database: generate, migrate, seed
   - npm run db:generate   # create SQL migration from schema (local dev only)
   - npm run db:migrate    # apply migrations to SQLite
   - npm run db:seed       # build 60d of mocked tutors/sessions

4) Run the app
   - npm run dev

## Scripts (suggested)
Add these to `package.json` once the project is scaffolded:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:generate": "drizzle-kit generate:sqlite",
    "db:migrate": "drizzle-kit migrate:sqlite",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx scripts/seed.ts"
  }
}
```

## Data Model (planned)
- Tutor(id, name, cohort, active, createdAt)
- Student(id, cohort, createdAt)
- Session(id, tutorId, studentId, startAt, endAt, firstSession:boolean, rating:1–5, rescheduled:boolean, noShow:boolean)
- TutorDailyAgg(date, tutorId, noShowRate, rescheduleRate, firstSessionFailRate, avgRating, score)

## Scoring (no ML)
S = clamp(0, 100 − 1.4×NS − 1.0×RS − 1.2×FF − Penalty_rating)
- NS: no‑show rate %, RS: reschedule rate %, FF: first‑session failure rate % (rating < 3)
- Penalty_rating = max(0, (4.3 − AvgRating)) × 12
- Bands: High < 60, Medium 60–79, Low ≥ 80

## Pages (planned)
- Dashboard: KPI cards (NS, RS, FF, Avg Rating, Risk bands), NS/RS/FF trends, risk distribution bar, Top 10 at‑risk table.
- Tutors: sortable/filterable list with score chips and driver badges.
- Tutor Profile: score timeline, metric mini‑charts, recent sessions, drivers.
- Sessions: recent sessions table with flags and filters; CSV export.

## CSV Export
- Server route returns CSV for tutors and sessions with computed fields.
- No external deps required; simple CSV writer/stringifier.

Schemas

Tutors CSV (`/api/export/tutors.csv`)
- tutorId, name, cohort, score, riskBand
- noShowRate30d, rescheduleRate30d, firstSessionFailRate30d, avgRating30d, sessions30d
- drivers (semicolon-delimited)

Sessions CSV (`/api/export/sessions.csv`)
- sessionId, date, tutorId, tutorName, studentId
- firstSession, rating, rescheduled, noShow
 - accepts `from`, `to`, `tutorId`, `firstSession`, `rescheduled`, `noShow`

## Environment
- No secrets required for v1; everything runs locally with SQLite.
- Future: replace SQLite with Postgres and add cron for hourly aggregates.

## Notes & Assumptions
- All data is mocked; we assume we have ratings, flags for reschedule/no‑show, and first‑session indicator.
- No auth or role management in v1.
- Seed data generated via `npm run db:seed` (deterministic with faker seed).

## Deployment Notes
- Next.js server functions need the SQLite file. `next.config.ts` uses `outputFileTracingIncludes` so `.data/app.db` ships with the build.
- On Vercel, set the build command to `npm run db:migrate && npm run db:seed && npm run build` (skip `db:generate`).
- The seed step must run before `next build` so the traced DB file exists.

## Charts
- Use shadcn/ui primitives with Recharts components (LineChart, AreaChart, BarChart).
- Time ranges: default 30d, with quick picks (7/14/30/60).
- Accessibility: provide labels/tooltips; avoid color-only encodings.
