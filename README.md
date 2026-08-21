# TalentFlow AI

TalentFlow AI is a Next.js 16 HR recruitment & hiring platform for managing job postings, automated multi-channel sourcing, candidate evaluation scoring weights, automated n8n webhook candidate sourcing pipelines, job lifecycle status management, candidate pipeline ranking & screening, candidate detail views, candidate status actions (Shortlist/Reject/Hold) with n8n email automation, job analytics & CSV export reporting, HR account & default weights settings, candidate magic-link token validation system, assessments, and secure HR login flows.

## Stack
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Database ORM**: Prisma 7
- **Database Engine**: PostgreSQL (Neon)
- **Authentication**: NextAuth v5 credentials strategy (`bcryptjs` hashing, HTTP-only JWT cookies) for HR / Magic Link UUID Tokens for Candidates
- **HTTP Client**: Axios
- **Data Visualization**: Recharts
- **Animations**: Framer Motion
- **Toasts**: Sonner
- **Date Formatting**: date-fns
- **Styling**: Tailwind CSS + shadcn/ui components

## Core Features Implemented

### 🤖 AI Candidate Scoring & Matching Engine (Chunks A1 – A4)
- **Vector Resume Matcher (`POST /api/scoring/resume-match`)**: Computes cosine similarity vector match score (out of 10) against job skills and description using Qdrant vector database with in-memory similarity fallback.
- **Composite Score Calculator (`POST /api/scoring/composite`)**: Normalizes candidate scores (Resume, Test, AI Interview) based on job scoring weights and categorizes candidates into qualification tiers (`strong`, `qualified`, `marginal`, `unqualified`).
- **AI Summary Generator (`POST /api/scoring/summary`)**: Generates structured, objective HR insights and strengths/weaknesses breakdown using GPT-4o.
- **Scoring Pipeline Orchestrator (`POST /api/scoring/run`)**: End-to-end scoring orchestrator with CLI runner (`npm run score:candidate`).

### 🔄 n8n Automation Workflows & Webhooks
- **Next.js Webhook API (`POST /api/webhooks/n8n`, `GET /api/webhooks/n8n`)**: Webhook route handling `candidates_sourced`, `parse_resumes`, `normalize_skills`, `update_candidate_status`, `run_scoring`, and token lookups with automatic fallback ID resolution.
- **W1 Candidate Sourcing Workflow (`n8n-workflows/talentflow-candidate-sourcing.json`)**: Sourcing workflow scraping LinkedIn, Upwork, and Indeed, deduplicating records, saving to Neon Postgres, and triggering W2.
- **W2 Resume Parsing & Email Workflow (`n8n-workflows/talentflow-resume-parsing.json`)**: Parsing chain utilizing Affinda API, skill normalization, resume matching, and automated email dispatch via Resend API.
- **n8n Webhook Test CLI (`scripts/test-n8n-webhook.ts`)**: Terminal tool (`npx tsx scripts/test-n8n-webhook.ts`) for testing n8n API routes locally.

### 🎙️ Candidate Assessment & AI Interview Portal (Chunks C1 – C8)
- **Magic Link Token Access**: Candidates access skills test assessments (`/assessment/[token]`) and interactive AI interviews (`/interview/[token]`) using unique UUID tokens generated in the database. No password, session cookie, or login required.
- **Server Validation Utility (`src/lib/candidate-token.ts`)**:
  - `validateAssessmentToken(token)`: Queries candidate, checks if assessment has already been submitted, and returns candidate/job metadata or error reason.
  - `validateInterviewToken(token)`: Queries candidate, checks if AI interview session is completed, and returns candidate/job metadata or error reason.
- **Candidate Skill Assessment Test**: Timer, multiple-choice questions, code editor, text inputs, and server-side AI grading (`POST /api/assessment/[token]/submit`).
- **Interactive AI Interview Chat**: Live conversational dialogue thread with AI interviewer, real-time message history, dynamic question progression, and audio controls.
- **Usage-Based Token Locking & Redirection**:
  - Invalid / Not Found Token -> Redirects to `/link-expired`
  - Already Submitted Assessment -> Redirects to `/assessment-complete`
  - Already Completed AI Interview -> Redirects to `/interview-complete`
- **Developer Test Candidate Seed Script (`scripts/seed-test-candidate.ts`)**:
  - Run via `npm run seed:candidate`.
  - Creates a test candidate record in Neon Postgres, generates UUID tokens, outputs assessment and interview URLs directly to the terminal, and sends an email invitation via Resend.

### ⚙️ Account & App Settings (Chunk 11)
- HR Manager Settings screen at `/settings` and `/dashboard/settings`.
- `GET /api/settings`: Returns HR Manager profile (`name`, `email`) + `preferences` (`defaultWeights`, `notifyPipeline`, `notifyComplete`).
- `PATCH /api/settings/profile`: Updates display name immediately. Handles email uniqueness verification via Resend.
- `PATCH /api/settings/password`: Validates current password using `bcrypt.compare()` and updates `passwordHash`.
- `PATCH /api/settings/preferences`: Enforces 100% total weight sum validation and upserts `hr_preferences`. Pre-fills new job creation forms automatically.

### 📈 Analytics & Reporting (Chunk 10)
- Job Analytics & Reporting Dashboard at `/jobs/[jobId]/analytics`.
- Recruitment funnel metrics, conversion rates, score aggregations, best channel detection, skill gap analysis, and avg time to shortlist.
- CSV export streaming endpoint (`/api/analytics/:jobId/export`).

### ⚡ Shortlist / Reject / Hold Actions (Chunk 9)
- Candidate action buttons (`Shortlist` ✅, `Hold` ⏸, `Reject` ❌) present on both candidate cards and detail view.
- Audit logging in `candidate_status_logs` and automated email webhook trigger via n8n.

### 👤 Candidate Detail View (Chunk 8)
- Full-page candidate profile screen at `/jobs/[jobId]/candidates/[candidateId]`.
- 4 tabbed sections: Profile & Resume, Assessment Test breakdown, AI Interview transcript thread, Scores & AI Summary.

### 👥 Candidate Pipeline Dashboard (Chunk 7)
- Candidate Pipeline Dashboard embedded on `/jobs/[jobId]` view.
- Filter bar (score range, source platform, stage), score progress bars, stage badges, and paginated candidate list.

### 📊 Jobs List & Management (Chunk 6)
- Responsive job postings dashboard at `/jobs` with status tabs (`All`, `Active`, `Paused`, `Closed`, `Draft`).
- Status lifecycle actions (`Pause`, `Close`, `Reopen`) with transaction audit logging and n8n webhook triggers.

### 🚀 Job Launch & n8n Automation Trigger (Chunk 5)
- "Launch Job" button in `CreateJobForm` posting payload to n8n webhook endpoint with retry options.

### 🎚️ Candidate Scoring Weights Configuration (Chunk 4)
- Resume, Test, and Interview weight sliders with 100% auto-rebalancing logic.

### 🌐 Automated Sourcing Configuration (Chunk 3)
- Platform toggles for LinkedIn, Upwork, and Indeed.

### 📝 Job Posting Creation (Chunk 2)
- Form at `/jobs/create` with Zod validation.

### 🔐 Auth & Account Setup (Chunk 1)
- HR Manager credentials login, protected routes via `src/proxy.ts`, and password reset flows.

## Project Structure

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx               # HR Login Screen
│   │   └── forgot-password/page.tsx     # Forgot Password Request
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx           # Dashboard landing with real-time metrics
│   │   ├── jobs/
│   │   │   ├── page.tsx                 # Job Postings list & management dashboard
│   │   │   ├── create/page.tsx          # Create/Edit Job form page
│   │   │   └── [jobId]/
│   │   │       ├── page.tsx             # Job details & Candidate Pipeline page
│   │   │       ├── analytics/
│   │   │       │   └── page.tsx         # Job Analytics & Reports Page
│   │   │       └── candidates/
│   │   │           └── [candidateId]/
│   │   │               └── page.tsx     # Full Candidate Detail Profile Page
│   │   ├── settings/
│   │   │   └── page.tsx                 # HR Account Settings Page
│   │   └── layout.tsx                   # Dashboard navigation sidebar & navbar shell
│   ├── assessment/
│   │   └── [token]/page.tsx             # Candidate Assessment Page (Chunk C1)
│   ├── interview/
│   │   └── [token]/page.tsx             # Candidate AI Interview Page (Chunk C1)
│   ├── link-expired/page.tsx            # Link Expired Error Screen (Chunk C1)
│   ├── assessment-complete/page.tsx     # Assessment Complete Screen (Chunk C1)
│   ├── interview-complete/page.tsx      # Interview Complete Screen (Chunk C1)
│   └── api/
│       ├── settings/...
│       ├── analytics/...
│       ├── candidates/...
│       └── jobs/...
├── lib/
│   ├── candidate-token.ts               # Candidate token validation utility (Chunk C1)
│   ├── prisma.ts                        # Prisma 7 adapter client instance
│   └── validations/job.ts              # Zod validation schemas
scripts/
└── seed-test-candidate.ts               # Developer seed script for test candidates (Chunk C1)
```

## Core Commands

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Sync Prisma schema & generate client:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Seed a test candidate with magic link tokens:**
   ```bash
   npm run seed:candidate
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
