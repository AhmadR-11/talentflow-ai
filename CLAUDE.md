# Claude Project Guide

This file is the Claude-specific entry point for this repository.

It intentionally includes and extends the shared project guidance in `AGENTS.md`.

## Scope
Claude should operate as a project-aware coding assistant for this TalentFlow AI repository.

## Shared instructions
- Read `AGENTS.md` first for project-wide rules and conventions.
- Maintain compatibility with the current stack: Next.js 16, React 19, Prisma 7, Postgres/Neon, NextAuth v5 credentials auth, Axios, Sonner, Recharts, date-fns, Framer Motion.
- Follow project-specific route and folder conventions.

## Project specifics
- App Router is the primary pattern.
- Use `src/proxy.ts` instead of old middleware conventions.
- Keep dashboard auth checks in `src/proxy.ts` or in server components that call `auth()`.
- Candidates use magic token URLs (`/assessment/[token]` and `/interview/[token]`); there are no cookies/JWTs for candidates.
- Seed test candidates using `npm run seed:candidate`.
- Verify with `npx tsc --noEmit` before finalizing project changes.

## Implemented Chunks Summary (Chunks 1 – 11, Chunk C1)
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
12. **Chunk C1 — Candidate Token Validation System**: Magic link validation (`/assessment/[token]` & `/interview/[token]`) via `src/lib/candidate-token.ts`, status redirection (`/link-expired`, `/assessment-complete`, `/interview-complete`), personalized candidate pages, and `scripts/seed-test-candidate.ts` testing seed script.
13. **Chunks C2 – C8 — Assessment & AI Interview Portal**: Skill assessment test component with timer, multiple-choice questions, code editor, AI grading submission, interactive AI interview chat with real-time audio controls, dynamic question progression, and completion views.
14. **Chunks A1 – A4 — AI & Scoring Engine**: Vector similarity resume matcher (`POST /api/scoring/resume-match`), composite score calculator (`POST /api/scoring/composite`), GPT-4o candidate HR summary generator (`POST /api/scoring/summary`), and pipeline orchestrator (`POST /api/scoring/run` & `npm run score:candidate`).
15. **n8n Automation Workflows & Webhooks**: Resilient webhook route (`POST /api/webhooks/n8n`), candidate token lookup route (`GET /api/webhooks/n8n`), W1 Sourcing workflow (`n8n-workflows/talentflow-candidate-sourcing.json`), W2 Resume Parsing & Email Invitation workflow (`n8n-workflows/talentflow-resume-parsing.json`), and test script (`scripts/test-n8n-webhook.ts`).

## Quick references
- Candidate Token Utility: `src/lib/candidate-token.ts`
- Candidate Seed Script: `scripts/seed-test-candidate.ts`
- Webhook Test Script: `scripts/test-n8n-webhook.ts`
- Scoring Orchestrator Script: `scripts/run-scoring.ts`
- Assessment Route: `src/app/assessment/[token]/page.tsx`
- Interview Route: `src/app/interview/[token]/page.tsx`
- Webhook API Route: `src/app/api/webhooks/n8n/route.ts`
- Scoring Run Route: `src/app/api/scoring/run/route.ts`
- Settings page: `src/app/(dashboard)/settings/page.tsx`
- Analytics page: `src/app/(dashboard)/jobs/[jobId]/analytics/page.tsx`
- Candidate detail page: `src/app/(dashboard)/jobs/[jobId]/candidates/[candidateId]/page.tsx`
- Auth config: `src/auth.ts`
- Proxy config: `src/proxy.ts`
- Prisma schema: `prisma/schema.prisma`

@AGENTS.md
