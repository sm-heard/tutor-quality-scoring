# Implementation Plan (simple, no auth/testing/ML)

## Stack
- Next.js (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Recharts (charts) with shadcn patterns
- Drizzle ORM + better‑sqlite3 (SQLite)

## Week 1
1) Scaffold & UI shell
   - Init Next.js app structure, Tailwind, shadcn/ui, base layout, nav.
   - Add theme tokens and base components (button, card, table primitives).

2) Data schema & seeds
   - Drizzle schema for Tutor, Student, Session, TutorDailyAgg.
   - Seed script for 60 days of data (~3k/day) with realistic distributions.
   - Include configured variability, seasonality, and outliers per PRD.

3) Heuristics & aggregates
   - Implement rule‑based scoring and drivers.
   - Aggregation utility to compute trailing 7/30‑day metrics per tutor.
   - Expose a simple recompute function used by routes and seed.

4) Tutors list
   - Table with sorting/filtering by score, risk band, cohort.
   - Inline driver chips and quick links to detail.
   - Columns: Tutor, Score, NS%, RS%, FF%, Avg Rating, Sessions (30d), Drivers.

## Week 2
5) Dashboard
   - KPI cards (NS, RS, FF, Avg Rating, Low/Med/High counts).
   - Trends (line/area charts) with date range selector.
   - Risk distribution bar; table: Top 10 at‑risk tutors.

6) Tutor profile
   - Score breakdown, charts, recent sessions, driver callouts.
   - Charts: score timeline (line), sessions by outcome (stacked bars), rating trend.

7) Sessions view
   - Paginated list with flags, simple filters, quick CSV export.
   - Filters: date range, tutor, first‑session, rescheduled, no‑show.

8) CSV export
   - Server route to export tutors and sessions with computed fields.
   - Columns per PRD; support `from`/`to` query params.

9) Freshness & perf
   - Lightweight cron or on‑demand recompute; in‑memory cache.
   - Budget: P95 page < 2s on mock volumes.

10) Polish
   - Empty states, loading, error boundaries, docs.
   - CSV verified by importing to Sheets/Excel.

## Deliverables
- Working dashboard (Dashboard, Tutors, Tutor Profile, Sessions)
- SQLite DB + seeds + migrations
- Rule‑based composite score + drivers
- CSV export endpoints
- Documentation (README, PRD, Plan)
 - Charts and tables as specified
