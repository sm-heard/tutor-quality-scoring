# Tutor Quality Scoring System — PRD (v1)

## Overview
Build a simple dashboard that evaluates tutor performance per session and per tutor using rule‑based heuristics (no ML), highlights coaching opportunities, flags risk patterns (first‑session issues, reschedules, no‑shows), and supports CSV export. All data is mocked and stored in SQLite.

## Goals
- Process ~3,000 sessions/day of mocked data and surface insights within 1 hour of “session completion” (simulated via a scheduled or on‑demand compute step).
- Provide an explainable composite tutor score with clear drivers.
- Enable Ops/Leads to view KPIs, drill into tutors, and export data.

## Non‑Goals (v1)
- No authentication/authorization.
- No ML/AI models or transcript analysis.
- No external integrations besides CSV export.

## Users
- Ops/Program Leads: Monitor KPIs, identify at‑risk tutors, export data.
- Coach Managers: Drill into tutor profiles, see drivers, plan interventions.

## Core Features
- Dashboard KPIs: First‑session failure rate, no‑show rate, reschedule rate; trends.
- Tutors List: Sort/filter by composite score and risk factors.
- Tutor Profile: History charts, recent sessions, score drivers, suggested actions (static text for v1).
- Sessions View: Recent sessions with flags (first session, rescheduled, no‑show).
- CSV Export: Download tutors and/or sessions with computed fields.

## KPIs & Visualizations

| KPI | Definition (30d trailing unless noted) | Visualization | Refresh |
| --- | --- | --- | --- |
| No‑show rate | noShow sessions / scheduled sessions | KPI card + line chart | hourly/on‑demand |
| Reschedule rate | tutor‑initiated reschedules / scheduled sessions | KPI card + line chart | hourly/on‑demand |
| First‑session failure | first sessions with rating < 3 / first sessions | KPI card + stacked bar (first vs failures) | hourly/on‑demand |
| Avg rating | mean of ratings 1–5 | KPI card + area chart | hourly/on‑demand |
| Risk distribution | count of tutors in Low/Med/High bands | Bar chart | hourly/on‑demand |
| Top at‑risk tutors | lowest composite scores with drivers | Table | hourly/on‑demand |

Page widgets
- Dashboard: 5 KPI cards, time‑series for NS/RS/FF, risk distribution bar, table of top 10 at‑risk tutors.
- Tutors: data table (sortable/filterable) with score chips and driver badges.
- Tutor Profile: score timeline, metric mini‑charts, recent sessions table, driver list.
- Sessions: paginated table with flags and simple filters; CSV export.

## Data Model (mocked)
- Tutor(id, name, cohort, active, createdAt)
- Student(id, cohort, createdAt)
- Session(id, tutorId, studentId, startAt, endAt, firstSession:boolean, rating:1–5, rescheduled:boolean, noShow:boolean)
- TutorDailyAgg(date, tutorId, noShowRate, rescheduleRate, firstSessionFailRate, avgRating, score)

Notes
- “First‑session failure” is defined as a first session with rating < 3 or an explicit failure flag if provided. For v1 we use rating < 3.
- “Rescheduled” is counted if the session was moved and attributed to the tutor (mocked boolean).

## Scoring (rule‑based, explainable)
Composite score S in [0, 100], higher is better.

Inputs (trailing 30 days, minimum 5 sessions to score):
- NS = no‑show rate (%)
- RS = reschedule rate (%)
- FF = first‑session failure rate (%)
- AR = average rating (1–5)

Formula (with sensible defaults):
- Penalty_rating = max(0, (4.3 − AR)) × 12  // zero penalty at ≥4.3, linear below
- S = clamp(0, 100 − 1.4×NS − 1.0×RS − 1.2×FF − Penalty_rating)

Risk bands (defaults; editable later):
- High risk: S < 60
- Medium risk: 60 ≤ S < 80
- Low risk: S ≥ 80

Drivers shown to users:
- “High no‑show rate last 30d” (NS threshold > 8%)
- “High reschedule rate last 30d” (RS > 15%)
- “Poor first‑session outcomes” (FF > 20% or few first sessions with low ratings)
- “Low average rating” (AR < 4.0)

Tutor list columns (default)

| Column | Details |
| --- | --- |
| Tutor | name, cohort |
| Score | composite score (0–100), risk band chip |
| No‑show 30d | percentage and count |
| Reschedule 30d | percentage and count |
| First‑session fail 30d | percentage and count |
| Avg rating 30d | 1–5 |
| Sessions 30d | count |
| Drivers | chips: NS/RS/FF/Rating flags |

## Performance & Freshness
- Batch compute aggregates hourly (or on demand when loading the dashboard in dev). 
- Page response P95 < 2s against SQLite on local/dev data volumes.

## Accessibility & UX
- Use shadcn/ui components for consistent, accessible UI. 
- Charts via shadcn + Recharts.

## CSV Specifications

Endpoints
- GET `/api/export/tutors.csv?from=YYYY-MM-DD&to=YYYY-MM-DD`
- GET `/api/export/sessions.csv?from=YYYY-MM-DD&to=YYYY-MM-DD`

CSV: tutors.csv (one row per tutor)

| Column | Type | Notes |
| --- | --- | --- |
| tutorId | string | |
| name | string | |
| cohort | string | |
| score | number | 0–100 |
| riskBand | string | low/medium/high |
| noShowRate30d | number | 0–1 |
| rescheduleRate30d | number | 0–1 |
| firstSessionFailRate30d | number | 0–1 |
| avgRating30d | number | 1–5 |
| sessions30d | integer | |
| drivers | string | semicolon‑delimited labels |

CSV: sessions.csv (one row per session)

| Column | Type | Notes |
| --- | --- | --- |
| sessionId | string | |
| date | date | session start date |
| tutorId | string | |
| tutorName | string | convenience |
| studentId | string | |
| firstSession | boolean | |
| rating | integer | 1–5 or null |
| rescheduled | boolean | tutor‑initiated (mocked) |
| noShow | boolean | |

## Success Metrics
- Clear identification of top 10 at‑risk tutors with explainable drivers.
- 1‑hour (or on‑demand) freshness for aggregates.
- CSV export consumed by Ops without additional manipulation.

## Future (post‑v1)
- Role‑based access, multi‑program views.
- Configurable weights/thresholds via UI and persisted config.
- Real data ingestion; migrate SQLite → Postgres.
- Optional ML for improved risk prediction.

## Mock Data Distributions (for seeds)

Baseline rates (global means; per‑tutor variability added by sampling):
- No‑show base: 6–10% (skewed right)
- Reschedule base: 10–18% (skewed right)
- First‑session fail base: 12–20%
- Rating: normal around 4.3 (sd 0.4), clipped to [1,5]
- First‑session proportion: 15–25% of sessions

Seasonality (optional):
- Weekday effects: +2% reschedules Mon/Fri; −1% Wed.
- Time‑of‑day: +3% no‑shows for late evening.

Outliers (to test UI):
- 2–3% tutors with >20% no‑show.
- 2–3% tutors with >30% reschedule.
- 1% tutors with avg rating < 3.5.

