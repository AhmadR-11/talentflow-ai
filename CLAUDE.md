# Claude Project Guide

This file is the Claude-specific entry point for this repository.

It intentionally includes and extends the shared project guidance in `AGENTS.md`.

## Scope
Claude should operate as a project-aware coding assistant for this TalentFlow AI repository.

## Shared instructions
- Read `AGENTS.md` first for project-wide rules and conventions.
- Maintain compatibility with the current stack: Next.js 16, React 19, Prisma 7, Postgres/Neon, NextAuth v5 credentials auth, Axios, Sonner, Recharts, date-fns.
- Follow project-specific route and folder conventions.

## Project specifics
- App Router is the primary pattern.
- Use `src/proxy.ts` instead of old middleware conventions.
- Keep dashboard auth checks in `src/proxy.ts` or in server components that call `auth()`.
- Do not assume mock data or a local DB is available; the app expects Neon Postgres in `.env`.
- Use `npx prisma db push` after making schema changes.
- Verify with `npx tsc --noEmit` before finalizing project changes.

## Implemented Chunks Summary (Chunks 1 – 11)
1. **Chunk 1 — Auth & Account Setup**: NextAuth credentials login, JWT session in HTTP-only cookie (`talentflow_session`), 24h session expiration, forgot/reset password flow, protected `/dashboard` & `/jobs` routes via `src/proxy.ts`.
2. **Chunk 2 — Job Posting Creation**: `/jobs/create` form page with inline Zod validation, Job Title (max 100), Description (min 100), Experience Level, Employment Type, Location, Required Skills multi-tag input, saved in `job_postings` table with default status `draft`.
3. **Chunk 3 — Sourcing Configuration**: `SourcingConfigPanel` within Create Job form with toggles for LinkedIn, Upwork, and Indeed. Enforces at least 1 active platform with warning prompt. Stored in `job_sourcing_config`.
4. **Chunk 4 — Scoring Weights Configuration**: `ScoringWeightsConfigPanel` (Resume 30%, Test 40%, Interview 30% defaults) with automatic 100% total adjustment sliders, live `Total: 100% ✅` indicator, inline editor on job detail page, stored in `job_scoring_weights`.
5. **Chunk 5 — Job Launch & n8n Trigger**: `POST /api/jobs/:id/launch` API endpoint updating status to `'active'` and triggering n8n webhook (`N8N_WEBHOOK_URL`) via `axios` with fallback warning. UI includes "Launch Job" button, sonner toasts, and "Retry Automation" action.
6. **Chunk 6 — Jobs List & Management**: `/jobs` postings list screen with status filter tabs, search, 2-column grid, `JobCard` components with `date-fns` formatting, candidate count, and `DropdownMenu` status actions (`Pause`, `Close`, `Reopen`). `PATCH /api/jobs/:id/status` endpoint manages transactions, `job_status_logs` audit records, and n8n webhook triggers on reopening.
7. **Chunk 7 — Candidate Pipeline Dashboard**: Candidate Pipeline Dashboard embedded on `/jobs/[jobId]` screen. `GET /api/jobs/:id/candidates` endpoint handles `minScore`, `maxScore`, `source`, `stage`, `page`, and `limit` parameters, joining `candidates` with `candidate_scores` ordered by `compositeScore` descending. UI includes stats bar (4 metric tiles), filter bar, score progress bars, color-coded source/stage badges, AI summary blocks, Skeleton loading state, and "Load More" pagination.
8. **Chunk 8 — Candidate Detail View**: Full-page candidate profile view at `/jobs/[jobId]/candidates/[candidateId]`. `GET /api/candidates/:candidateId` endpoint returns full relations (`scores`, `assessmentSubmission`, `interviewSession`, `job.scoringWeights`). UI includes header with action buttons (`Shortlist`, `Hold`, `Reject`), and 4 tabbed sections: Profile & Resume, Assessment Test breakdown table, AI Interview conversation transcript thread, and Scores & AI Summary.
9. **Chunk 9 — Shortlist / Reject / Hold Actions**: Candidate status action system (Shortlist ✅, Reject ❌, Hold ⏸). `POST /api/candidates/:candidateId/action` endpoint executes Prisma transaction (updates `status` and creates audit log in `candidate_status_logs`), guards against double-action (`400 Bad Request`), and fires POST webhook to `N8N_WEBHOOK_URL` (`event: "candidate_action"`, candidate info, job info, company info, HR manager info) for automated email notifications. `ActionButtons.tsx` component features `shadcn` Reject Confirmation Modal, disabled active states, and Sonner toasts.
10. **Chunk 10 — Analytics & Reporting**: Job Analytics & Reporting Dashboard at `/jobs/[jobId]/analytics`. `GET /api/analytics/:jobId` endpoint computes recruitment funnel metrics, score aggregations, source platform performance with best channel detection, skill gap analysis, and avg time to shortlist. `GET /api/analytics/:jobId/export` streams downloadable candidate CSV files. UI features Recharts visualizations, metric cards, skill gap table, Skeleton states, and CSV export action.
11. **Chunk 11 — Settings**: Account & App Settings screen at `/settings` and `/dashboard/settings`. `GET /api/settings` returns HR Manager profile + `hr_preferences`. `PATCH /api/settings/profile` handles display name updates and email verification workflow via Resend. `PATCH /api/settings/password` handles bcrypt password validation and password updates. `PATCH /api/settings/preferences` validates 100% total weight sums and upserts `hr_preferences` (pre-filling new job forms). UI features 3 tabs (Profile & Password, Default Scoring Weights, Notification Toggles).

## Quick references
- Settings page: `src/app/(dashboard)/settings/page.tsx`
- Settings GET API: `src/app/api/settings/route.ts`
- Profile PATCH API: `src/app/api/settings/profile/route.ts`
- Password PATCH API: `src/app/api/settings/password/route.ts`
- Preferences PATCH API: `src/app/api/settings/preferences/route.ts`
- Analytics page: `src/app/(dashboard)/jobs/[jobId]/analytics/page.tsx`
- Candidate detail page: `src/app/(dashboard)/jobs/[jobId]/candidates/[candidateId]/page.tsx`
- Candidate pipeline dashboard: `src/components/jobs/candidate-pipeline-dashboard.tsx`
- Job details page: `src/app/(dashboard)/jobs/[jobId]/page.tsx`
- Auth config: `src/auth.ts`
- Proxy config: `src/proxy.ts`
- Prisma schema: `prisma/schema.prisma`

@AGENTS.md
