# TalentFlow AI Agent Guide

## Project purpose
This repository is a TalentFlow HR platform built with Next.js App Router, Prisma ORM, PostgreSQL (Neon), and NextAuth credentials auth.

The app is centered on HR login, dashboard access, job posting creation, sourcing configuration, candidate scoring weights, job launch automation trigger, jobs list management, candidate pipeline ranking & screening, candidate detail views, candidate status actions, job analytics & reporting dashboards, candidate flows, candidate token validation system (magic links), password reset flow, and HR account settings.

## Stack
- Framework: Next.js 16
- App Router: yes
- React: 19
- TypeScript: yes
- Styling: Tailwind CSS + shadcn/ui components + sonner toasts + Framer Motion
- Data Visualization: Recharts
- Auth: NextAuth v5 credentials strategy (for HR) / Magic Link Tokens (for Candidates)
- DB: PostgreSQL via Neon
- ORM: Prisma 7
- HTTP Client: Axios
- Email: Resend
- Runtime: Node.js

## Feature Implementation Progress (Chunks 1 - 11, Chunk C1)

### Chunk 1 — Authentication & Account Setup
- Credentials login validating against `HrManager.email` & `HrManager.passwordHash` using `bcryptjs`.
- JWT session generated and stored in HTTP-only cookie (`talentflow_session`).
- Forgot Password request (`/forgot-password`) & token-based reset page (`/reset-password`).
- Route protection in Next.js 16 via `src/proxy.ts` redirecting unauthenticated requests to `/login`.
- Session expiry set to 24 hours of inactivity.

### Chunk 2 — Job Posting Creation
- "Create New Job" form at `/jobs/create` with Zod validation.
- Fields: Job Title (max 100 chars), Job Description (rich textarea, min 100 chars), Experience Level (`Junior`, `Mid`, `Senior`, `Lead`), Employment Type (`Full-time`, `Part-time`, `Contract`, `Freelance`), Location (text/Remote toggle), Required Skills (multi-tag input).
- Job posting stored in `job_postings` table with default status `draft`.
- Full inline validation errors and character limit counters.

### Chunk 3 — Sourcing Configuration
- Sourcing panel embedded within Create Job form (`SourcingConfigPanel`).
- Toggles for platforms: **LinkedIn**, **Upwork**, **Indeed**.
- Requires at least 1 platform selected (shows warning: *"Please select at least one sourcing platform"*).
- Stored in `job_sourcing_config` table (`linkedin_enabled`, `upwork_enabled`, `indeed_enabled`).

### Chunk 4 — Scoring Weights Configuration
- Scoring weight sliders panel embedded within Create Job form & editable on Job Details page (`ScoringWeightsConfigPanel` & `ScoringWeightsEditor`).
- Sliders: Resume Match Weight (default 30%), Skills Test Weight (default 40%), AI Interview Weight (default 30%).
- Enforces that all three weights always sum to **exactly 100%** with automatic slider rebalancing.
- Live percentage total badge indicator (`Total: 100% ✅`).
- Stored in `job_scoring_weights` table (`resume_weight`, `test_weight`, `interview_weight`).

### Chunk 5 — Job Launch & n8n Trigger
- **"Launch Job"** button in `CreateJobForm`, active when all required fields pass validation.
- API Route `POST /api/jobs/:id/launch`:
  - Validates job ownership (`hrManagerId == session.user.id`).
  - Updates job status to `'active'` in `job_postings` table.
  - Constructs payload with `job_id`, `job_title`, `job_description`, `experience_level`, `required_skills`, `sourcing`, and `scoring_weights`.
  - Fires POST request to `process.env.N8N_WEBHOOK_URL` using `axios` (5-second timeout).
  - Returns `{ success: true, message: "Job launched successfully" }` if webhook succeeds.
  - If n8n call fails/times out: does NOT rollback DB — returns `{ success: true, warning: "Job saved. Automation could not be started — please retry from job settings." }`.
- Sonner toasts: displays success toast *"Job posted successfully! Automation has started."* or warning toast with retry option on job detail page.

### Chunk 6 — Jobs List & Management
- Responsive job postings dashboard at `/jobs` with 2-column grid and filter tabs (`All`, `Active`, `Paused`, `Closed`, `Draft`).
- API Route `GET /api/jobs`: Returns jobs belonging to authenticated HR Manager with `_count: { candidates: true }`, sorted by `createdAt` desc, supports status filtering.
- API Route `PATCH /api/jobs/:id/status`:
  - Accepts `{ action: "pause" | "close" | "reopen" }`.
  - Executes Prisma `$transaction` updating `status` and logging event in `job_status_logs`.
  - Reopen action fires n8n webhook (`event: "job_reopened"`).
- Job Cards: Title, color-coded status badges, creation date formatted with `date-fns`, candidates count, contextual `DropdownMenu` status actions, optimistic UI updates, and Sonner toasts.

### Chunk 7 — Candidate Pipeline Dashboard
- Candidate Pipeline Dashboard embedded on `/jobs/[jobId]` view.
- API Route `GET /api/jobs/:jobId/candidates`:
  - Validates job ownership.
  - Supports query filters: `minScore`, `maxScore`, `source` (`linkedin`, `upwork`, `indeed`), `stage` (`sourced`, `screened`, `interviewed`, `shortlisted`, `rejected`), `page`, and `limit`.
  - Joins `candidates` with `candidate_scores`, ordered by `compositeScore` descending.
  - Returns paginated candidate array and pipeline stage metrics.
- Candidate Pipeline UI (`CandidatePipelineDashboard`):
  - Top 4 Metric Tiles: Total Sourced | Screened | Shortlisted | Rejected.
  - Horizontal Filter Bar: Score Range Inputs (0–10), Source Platform dropdown, Stage dropdown, "Apply Filters", and "Reset".
  - Candidate Cards: Full Name, Source Badge (LinkedIn: Blue, Upwork: Green, Indeed: Orange), Composite Score (`"9.2 / 10"`) with visual `Progress` bar, Stage Badge, AI Summary text block, and "View Profile" action.
  - Pagination ("Load More" button & candidate count text), Skeleton loading state, and centered empty state.

### Chunk 8 — Candidate Detail View
- Full-page candidate profile view at `/jobs/[jobId]/candidates/[candidateId]`.
- API Route `GET /api/candidates/:candidateId`:
  - Validates candidate job ownership.
  - Includes `scores`, `assessmentSubmission`, `interviewSession`, and `job.scoringWeights`.
- Candidate Detail UI:
  - Header: Back button (`Back to Pipeline`), Full Name, Stage Badge, Action Buttons (`Shortlist`, `Hold`, `Reject`).
  - Tab 1 (Profile & Resume): Info grid, normalized skill badges, PDF iframe embed or S3 download button.
  - Tab 2 (Assessment Test): Prominent overall test score (`"72 / 100"`) & per-question evaluation breakdown table (`Question #`, `Question Text`, `Candidate Answer`, `Score`, `Max Score`, `Justification`).
  - Tab 3 (AI Interview): Prominent interview score & conversational dialogue thread (AI left gray bubble vs Candidate right blue bubble).
  - Tab 4 (Scores & Summary): Large Composite Fit Score (`"8.7 / 10"`), 3 weighted progress bars (Resume Match 30%, Skills Test 40%, AI Interview 30%), AI summary card, green Strengths pills, and orange Weaknesses pills.

### Chunk 9 — Shortlist / Reject / Hold Actions
- Candidate status action system (Shortlist ✅, Reject ❌, Hold ⏸).
- API Route `POST /api/candidates/:candidateId/action`:
  - Validates HR Manager job ownership.
  - Guards against double-action (`400 Bad Request` if candidate is already in requested state).
  - Maps actions (`shortlist` -> `shortlisted`, `reject` -> `rejected`, `hold` -> `on_hold`).
  - Prisma `$transaction`: updates `candidate.status` and inserts audit record in `candidate_status_logs`.
  - Webhook POST to `N8N_WEBHOOK_URL` (`event: "candidate_action"`, candidate data, job data, company name, HR name) for automated email dispatch.
- Frontend UI (`ActionButtons.tsx`):
  - Used on both candidate cards (`CandidatePipelineDashboard`) and full detail view (`/jobs/[jobId]/candidates/[candidateId]`).
  - Reject Confirmation Modal: `shadcn` Dialog (`"Reject this candidate?"`, `"This will send a rejection email to [Candidate Name]. This action cannot be undone."`).
  - Sonner toasts for success, warning, and error states.

### Chunk 10 — Analytics & Reporting
- Job Analytics & Reporting Dashboard at `/jobs/[jobId]/analytics`.
- API Route `GET /api/analytics/:jobId`:
  - Validates job ownership.
  - Calculates recruitment funnel counts & stage conversion percentages.
  - Aggregates score metrics (Average, Highest, Lowest).
  - Analyzes source platform performance and identifies best performing platform.
  - Computes skill gap analysis and average time to shortlist.
- API Route `GET /api/analytics/:jobId/export`:
  - Streams downloadable candidate dataset CSV file.

### Chunk 11 — HR Manager Settings
- Account & App Settings screen at `/settings` and `/dashboard/settings`.
- API Route `GET /api/settings`: Returns HR Manager profile + `hr_preferences`.
- API Route `PATCH /api/settings/profile`: Updates display name immediately. Checks new email uniqueness, creates 24h verification token in `password_reset_tokens`, and dispatches verification email via Resend.
- API Route `PATCH /api/settings/password`: Validates current password with `bcrypt.compare()` and updates `passwordHash`.
- API Route `PATCH /api/settings/preferences`: Enforces 100% total scoring weight validation and upserts `hr_preferences`. Pre-fills Create Job form with default weights.
- Settings UI:
  - Tab 1: Profile & Password form with current password validation.
  - Tab 2: Default Scoring Weight sliders with auto 100% sum rebalancing and live indicator (`Total: 100% ✅`).
  - Tab 3: Notification preference toggles (`Switch`) for pipeline candidate and batch completion notifications with auto-save.

### Chunk C1 — Candidate Token Validation System
- Database schema: `assessmentToken` (UUID @unique) & `interviewToken` (UUID @unique) added to `Candidate` model.
- Server-side token validation utility: `src/lib/candidate-token.ts` with `validateAssessmentToken(token)` and `validateInterviewToken(token)`.
- Redirection rules & target pages:
  - Invalid / Not Found token -> `/link-expired`
  - Already submitted assessment -> `/assessment-complete`
  - Already completed AI interview -> `/interview-complete`
- Candidate Server Component pages:
  - `/assessment/[token]/page.tsx`: Validates token server-side, redirects invalid states, renders personalized candidate assessment view.
  - `/interview/[token]/page.tsx`: Validates token server-side, redirects invalid states, renders personalized candidate interview view.
- Testing Seed Script: `scripts/seed-test-candidate.ts` + `"seed:candidate": "npx tsx scripts/seed-test-candidate.ts"`. Creates test candidate, prints magic links to console, and sends test email via Resend.

### Chunks C2 - C8 — Candidate Assessment & AI Interview Portal
- **Chunk C2 — Assessment UI**: Candidate skill assessment component with timer, progress indicators, multiple-choice questions, code editor, and text inputs.
- **Chunk C3 & C4 — Assessment Evaluation & Submission**: Server-side AI grading of test answers, storing submission records in `assessment_submissions`, and updating candidate test score.
- **Chunk C5 — AI Interview Portal UI**: Interactive voice/text chat screen with AI interviewer, real-time message thread, dynamic question progression, and audio controls.
- **Chunk C6 — Interview Submission & AI Scoring**: `POST /api/interview/[token]/submit` endpoint saving session, scoring candidate responses using OpenAI, and triggering composite score re-calculation.
- **Chunk C7 & C8 — Completion & Link Expired Views**: Dedicated candidate confirmation screens (`/assessment-complete`, `/interview-complete`, `/link-expired`).

### Chunks A1 - A4 — AI & Scoring Engine
- **Chunk A1 — Resume Matcher (`POST /api/scoring/resume-match`)**: Computes cosine similarity vector match score (out of 10) against job skills and description using Qdrant vector database with fallback in-memory similarity matching.
- **Chunk A2 — Composite Score Calculator (`POST /api/scoring/composite`)**: Normalizes weighted composite fit scores (Resume, Skills Test, AI Interview) based on job scoring weights and assigns candidate qualification tier (`strong`, `qualified`, `marginal`, `unqualified`).
- **Chunk A3 — AI Summary Generator (`POST /api/scoring/summary`)**: Generates structured, objective HR insights and strengths/weaknesses breakdown using GPT-4o.
- **Chunk A4 — Scoring Orchestrator (`POST /api/scoring/run`)**: Orchestrates the entire pipeline end-to-end, updates DB models (`candidate_scores`, `candidates.compositeScore`), and provides CLI script `scripts/run-scoring.ts` (`npm run score:candidate`).

### n8n Automation Workflows & Webhooks
- **Next.js Webhook Handlers (`POST /api/webhooks/n8n`, `GET /api/webhooks/n8n`)**: Resilient API routes for n8n workflows (`candidates_sourced`, `parse_resumes`, `normalize_skills`, `update_candidate_status`, `run_scoring`, and token lookups) with automatic fallback ID resolution.
- **Workflow W1 — Candidate Sourcing (`n8n-workflows/talentflow-candidate-sourcing.json`)**: Sourcing workflow integrating LinkedIn, Upwork, and Indeed scraping, deduplication, DB insertion, and triggering W2.
- **Workflow W2 — Resume Parsing & Candidate Invites (`n8n-workflows/talentflow-resume-parsing.json`)**: Resume parsing chain using Affinda API, skill normalization, resume matching, candidate token lookup, and automated assessment invitation email dispatch via Resend API.
- **Webhook Test CLI (`scripts/test-n8n-webhook.ts`)**: Terminal utility (`npx tsx scripts/test-n8n-webhook.ts`) for testing n8n API routes locally.

## Important project facts
- Use App Router conventions, not pages router assumptions.
- The app uses `src/proxy.ts` as the Next.js 16 replacement for the older `middleware.ts` pattern.
- `src/auth.ts` contains the global auth configuration and credentials provider for HR.
- Candidates do not log in — unique UUID tokens in URL act as authentication.
- Auth-protected dashboard routes are under `src/app/(dashboard)`.
- Public candidate routes (`/assessment/*`, `/interview/*`, `/link-expired`, etc.) are under `src/app/`.
- Prisma models live in `prisma/schema.prisma`.
- Database config is managed in `prisma.config.ts` and the Prisma client in `src/lib/prisma.ts`.
- The runtime database URL is from Neon and should be stored in `.env`.

## Project structure
- `src/app/` — route pages and App Router layout
- `src/app/(auth)/login/page.tsx` — HR login screen
- `src/app/(auth)/forgot-password/page.tsx` — reset request page
- `src/app/reset-password/page.tsx` — set a new password using reset token
- `src/app/(dashboard)/dashboard/page.tsx` — protected dashboard landing page with metrics
- `src/app/(dashboard)/jobs/page.tsx` — job postings list & management dashboard
- `src/app/(dashboard)/jobs/create/page.tsx` — create & edit job posting form page
- `src/app/(dashboard)/jobs/[jobId]/page.tsx` — detailed job view with candidate pipeline dashboard
- `src/app/(dashboard)/jobs/[jobId]/analytics/page.tsx` — job analytics & reporting page
- `src/app/(dashboard)/jobs/[jobId]/candidates/[candidateId]/page.tsx` — candidate detail view
- `src/app/(dashboard)/settings/page.tsx` — settings page (Profile, Default Weights, Notifications)
- `src/app/assessment/[token]/page.tsx` — Candidate Assessment page
- `src/app/interview/[token]/page.tsx` — Candidate AI Interview page
- `src/app/link-expired/page.tsx` — Link expired error page
- `src/app/assessment-complete/page.tsx` — Assessment completed page
- `src/app/interview-complete/page.tsx` — Interview completed page
- `src/app/api/webhooks/n8n/route.ts` — n8n automation webhook route handler
- `src/app/api/scoring/run/route.ts` — Candidate scoring pipeline orchestrator endpoint
- `src/lib/candidate-token.ts` — Server token validation utility
- `n8n-workflows/talentflow-candidate-sourcing.json` — n8n W1 Candidate Sourcing Workflow
- `n8n-workflows/talentflow-resume-parsing.json` — n8n W2 Resume Parsing & Email Invitation Workflow
- `scripts/seed-test-candidate.ts` — Test candidate generator seed script
- `scripts/test-n8n-webhook.ts` — n8n webhook test script
- `src/lib/validations/job.ts` — Zod validation schemas for jobs, sourcing config, and scoring weights
- `src/auth.ts` — NextAuth config and credentials validation
- `src/proxy.ts` — route protection logic for dashboard routes
- `src/lib/prisma.ts` — Prisma client initialization with Prisma 7 adapter pattern
- `prisma/schema.prisma` — Prisma schema / models
- `.env` — local environment values including `DATABASE_URL`, `NEXTAUTH_SECRET`, `N8N_WEBHOOK_URL`

## Core commands
- Install deps: `npm install`
- Start app: `npm run dev`
- Type-check: `npx tsc --noEmit`
- Sync Prisma schema to DB: `npx prisma db push`
- Seed test candidate: `npm run seed:candidate`
- Run candidate scoring CLI: `npm run score:candidate`
- Test n8n webhook: `npx tsx scripts/test-n8n-webhook.ts`
- Validate Prisma schema: `npx prisma validate`

## Summary
This app is a full-featured HR hiring system scaffold with protected dashboard routes, credentials-based auth, password reset flow, job posting creation, automated sourcing configuration, dynamic scoring weights, n8n webhook automation launch, jobs management with audit logging, AI candidate pipeline scoring, candidate detail profiles, candidate action status workflows (Shortlist/Reject/Hold), job analytics & CSV export reporting, HR account & default weights settings, candidate magic-link token validation system, automated candidate assessment and AI interview portal, multi-step n8n automation workflows, and Neon-backed Prisma Postgres persistence.

