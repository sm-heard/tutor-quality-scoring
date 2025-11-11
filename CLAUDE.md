# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Database Operations
```bash
npm run db:generate  # Generate SQL migrations from schema (local dev only)
npm run db:migrate   # Apply migrations to SQLite database
npm run db:seed      # Generate 60 days of mocked tutor/session data
npm run db:studio    # Open Drizzle Studio for database inspection
```

### Application
```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Typical Development Flow
1. Make schema changes in `lib/db/schema.ts`
2. Run `npm run db:generate` to create migration files
3. Run `npm run db:migrate` to apply migrations
4. Run `npm run db:seed` if you need fresh test data
5. Run `npm run dev` to start the app

## Architecture Overview

### Stack
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Database**: SQLite via Drizzle ORM + better-sqlite3
- **UI**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts (via shadcn patterns)
- **Forms/State**: React Query (@tanstack/react-query)
- **Tables**: TanStack Table

### Core Concept: Tutor Quality Scoring

This application monitors tutor performance through a rule-based scoring system (no ML). The scoring formula is:

```
S = clamp(0, 100 − 1.4×NS − 1.0×RS − 1.2×FF − Penalty_rating)
```

Where:
- **NS**: No-show rate (%)
- **RS**: Reschedule rate (%)
- **FF**: First-session failure rate (% of first sessions with rating < 3)
- **Penalty_rating**: `max(0, (4.3 − AvgRating)) × 12`

Risk bands:
- **High Risk**: score < 60
- **Medium Risk**: 60 ≤ score < 80
- **Low Risk**: score ≥ 80

### Data Model

Four primary tables in `lib/db/schema.ts`:

1. **tutors**: Basic tutor info (id, name, cohort, active)
2. **students**: Basic student info (id, cohort)
3. **sessions**: Individual tutoring sessions with flags (firstSession, rating, rescheduled, noShow)
4. **tutorDailyMetrics**: Pre-aggregated daily metrics per tutor including:
   - Daily counts (sessions, no-shows, reschedules, first-session failures)
   - Trailing 7-day and 30-day rolling metrics
   - Computed score and risk drivers (stored as JSON array)

### Aggregation Pipeline

The key architectural pattern is **pre-aggregated metrics**:

1. **Source**: Raw `sessions` table contains all tutoring events
2. **Aggregation**: `lib/aggregation.ts` → `buildTutorDailyMetrics()` processes sessions into daily rollups with sliding windows
3. **Storage**: Results stored in `tutorDailyMetrics` table
4. **Consumption**: Data queries (`lib/data/*.ts`) primarily read from pre-aggregated metrics, not raw sessions

This pattern enables:
- Fast dashboard queries (no real-time aggregation)
- Historical score trending
- Efficient risk driver identification

The `buildTutorDailyMetrics` function uses a sliding window algorithm to compute both 7-day and 30-day trailing metrics for each day, then invokes `calculateCompositeScore` from `lib/scoring.ts`.

### Data Layer Pattern

All data fetching lives in `lib/data/*.ts`:
- `dashboard.ts`: KPI summaries, risk distribution, trending metrics
- `tutors.ts`: Tutor list with current scores and 30d metrics
- `tutor-detail.ts`: Single tutor timeline and recent sessions
- `sessions.ts`: Recent sessions list with filters

These modules:
- Query the database via Drizzle ORM
- Join against pre-aggregated metrics where possible
- Return typed, domain-specific data structures
- Are called from Server Components in the `app/` directory

### Page Structure

- `/dashboard`: High-level KPIs, trends, risk distribution, top at-risk tutors
- `/tutors`: Sortable/filterable list of all tutors with score chips and driver badges
- `/tutors/[tutorId]`: Individual tutor profile with score timeline, metric mini-charts, recent sessions
- `/sessions`: Recent sessions table with filter controls and CSV export

### CSV Export

Server routes at:
- `app/api/export/tutors.csv/route.ts`: Exports tutors with computed 30d metrics
- `app/api/export/sessions.csv/route.ts`: Exports sessions with optional filters (from, to, tutorId, flags)

No external CSV library needed; simple string building with proper escaping.

### UI Components

- **shadcn/ui**: Base components in `components/ui/` (button, card, table, select, badge, etc.)
- **Custom charts**: `components/charts/` wraps Recharts with domain-specific styling
- **Filters**: `components/tutor-filters.tsx` and `components/session-filters.tsx` provide client-side filter controls
- **Sidebar**: `components/app-sidebar.tsx` handles navigation (desktop + mobile)

## Database File Location

SQLite database lives at `.data/app.db` (configured in `drizzle.config.ts` and `lib/db/index.ts`). The directory is auto-created if missing.

**Important for Vercel deployment**: `next.config.ts` uses `outputFileTracingIncludes` to ensure the `.data/` folder and SQLite files are included in the build output. Build command should be:

```bash
npm run db:migrate && npm run db:seed && npm run build
```

(Run migrations and seed **before** `next build` so the traced DB file exists.)

## Scoring Logic Location

All scoring logic is in `lib/scoring.ts`:
- `calculateCompositeScore()`: Core formula implementation
- `determineRiskBand()`: Maps score to risk band
- `SCORE_THRESHOLDS`: Tunable constants for penalties and driver detection
- `SCORE_DRIVERS`: Human-readable labels for risk drivers

## Key Conventions

- **Date handling**: Use `date-fns` for all date operations; `lib/date.ts` provides `toDateKey()` and `fromDateKey()` for YYYY-MM-DD strings
- **Type safety**: Drizzle schema exports types via `$inferSelect` and `$inferInsert`
- **No auth**: v1 has no authentication or role management
- **No tests**: Project explicitly avoids testing for simplicity
- **Mocked data**: Seed script (`scripts/seed.ts`) uses `@faker-js/faker` with deterministic seed for reproducibility

## Common Patterns

### Adding a new metric to scoring
1. Update `CompositeScoreInput` type in `lib/scoring.ts`
2. Modify `calculateCompositeScore()` formula
3. Update `buildTutorDailyMetrics()` in `lib/aggregation.ts` to compute the metric
4. Add columns to `tutorDailyMetrics` schema if persisting
5. Run `npm run db:generate` and `npm run db:migrate`

### Adding a new page
1. Create `app/[page-name]/page.tsx` (Server Component)
2. Fetch data via functions in `lib/data/*.ts`
3. Add route to `NAV_ITEMS` in `app/layout.tsx`
4. If the page queries the database, add file tracing to `next.config.ts`

### Adding a new filter to sessions or tutors
1. Update the filter component (`components/tutor-filters.tsx` or `components/session-filters.tsx`)
2. Pass filter state up to parent page component
3. Modify data query in `lib/data/*.ts` to accept filter params
4. Update Drizzle `.where()` clauses accordingly
