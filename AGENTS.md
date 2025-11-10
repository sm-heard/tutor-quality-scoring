# Repository Guidelines

## Project Structure & Module Organization
- `app/` — Next.js App Router pages (dashboard, tutors, sessions) and layout.
- `components/` — shadcn/ui-based primitives, chart wrappers, and filters.
- `lib/` — data access, aggregation, scoring, and DB schema definitions.
- `scripts/` — seed utilities for mocked SQLite data.
- `drizzle/` & `drizzle.config.ts` — migrations generated via drizzle-kit.
- `types/` — hand-rolled ambient types (e.g., better-sqlite3 shim).

## Build, Test, and Development Commands
- `npm run dev` — launch Next.js dev server (App Router).
- `npm run db:migrate` — apply committed SQLite migrations.
- `npm run db:seed` — generate 60 days of mock tutors/sessions.
- `npm run build` — production build (requires seeded `.data/app.db`).
- `npm run lint` — ESLint (TS + Next) pass; ensure zero warnings before PRs.

## Coding Style & Naming Conventions
- TypeScript with strict mode; prefer explicit types for public exports.
- Components in `PascalCase`, hooks/utilities in `camelCase`.
- Tailwind for styling; keep class lists organized by layout → visuals.
- Run `npm run lint` before commits; autoformat via your editor or `eslint --fix`.

## Testing Guidelines
- No automated test suite yet; validate via `npm run lint`, `npm run build`, and manual UI checks.
- Seed fresh data (`npm run db:migrate && npm run db:seed`) before QA to ensure consistent dashboards.

## Commit & Pull Request Guidelines
- Follow conventional, descriptive commit messages (imperative mood e.g., `Add tutor risk filter`).
- Scope PRs narrowly; include summary, test/build output, and screenshots for UI changes.
- Keep migrations committed; never run `npm run db:generate` in CI/production builds.

## Deployment & Environment Notes
- SQLite lives in `.data/app.db`; Vercel build command should be `npm run db:migrate && npm run db:seed && npm run build`.
- `next.config.ts` traces the DB file; update `outputFileTracingIncludes` if new routes read from SQLite.
