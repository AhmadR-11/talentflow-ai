# TalentFlow AI

TalentFlow AI is a Next.js 16 HR recruitment & hiring platform for managing job postings, automated multi-channel sourcing, candidate evaluation scoring weights, automated n8n webhook candidate sourcing pipelines, job lifecycle status management, candidate ranking & screening pipelines, detailed candidate profile evaluation, candidate status actions (Shortlist/Reject/Hold) with n8n email automation, job analytics & CSV export reporting, HR account & default weights settings, assessments, and secure HR login flows.

## Stack
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Database ORM**: Prisma 7
- **Database Engine**: PostgreSQL (Neon)
- **Authentication**: NextAuth v5 credentials strategy (`bcryptjs` hashing, HTTP-only JWT cookies)
- **HTTP Client**: Axios
- **Data Visualization**: Recharts
- **Toasts**: Sonner
- **Date Formatting**: date-fns
- **Styling**: Tailwind CSS + shadcn/ui components

## Core Features Implemented

### 🔐 Auth & Account Setup (Chunk 1)
- HR Manager credentials login with `bcryptjs` password validation.
- Secure HTTP-only session cookie (`talentflow_session`) with 24-hour inactivity expiry.
- Protected `/dashboard` and `/jobs` routes backed by Next.js 16 `src/proxy.ts`.
- Password reset request (`/forgot-password`) and token reset flow (`/reset-password`).

### 📝 Job Posting Creation (Chunk 2)
- Interactive "Create New Job" form at `/jobs/create`.
- Fields: Job Title (max 100 chars), Job Description (min 100 chars), Experience Level (`Junior`, `Mid`, `Senior`, `Lead`), Employment Type (`Full-time`, `Part-time`, `Contract`, `Freelance`), Location (with Remote toggle), Required Skills (multi-tag input).
- Stored in `job_postings` table with default status `draft`.
- Zod schema validation with inline field error alerts and character counters.

### 🌐 Automated Sourcing Configuration (Chunk 3)
- Integrated sourcing panel (`SourcingConfigPanel`) within job creation and editing workflows.
- Toggle switches for **LinkedIn**, **Upwork**, and **Indeed**.
- Mandatory platform selection check — displays warning: *"Please select at least one sourcing platform"* if no platform is selected.
- Stored in `job_sourcing_config` table (`linkedin_enabled`, `upwork_enabled`, `indeed_enabled`).

### 🎚️ Candidate Scoring Weights Configuration (Chunk 4)
- Candidate evaluation weight sliders panel (`ScoringWeightsConfigPanel`):
  - **Resume Match Weight** (default: 30%)
  - **Skills Test Weight** (default: 40%)
  - **AI Interview Weight** (default: 30%)
- Enforces strict **100% total sum** across all three weights with automatic real-time slider rebalancing.
- Dynamic indicator badge (`Total: 100% ✅`).
- Inline weight editor on Job Detail view (`/jobs/[jobId]`) via `ScoringWeightsEditor`.
- Stored in `job_scoring_weights` table (`resume_weight`, `test_weight`, `interview_weight`).

### 🚀 Job Launch & n8n Automation Trigger (Chunk 5)
- **"Launch Job"** button in `CreateJobForm` (active when all required fields pass validation).
- Backend handler `POST /api/jobs/:id/launch`:
  - Validates HR Manager ownership.
  - Updates job status to `'active'` in `job_postings` table.
  - Constructs payload (`job_id`, `job_title`, `job_description`, `experience_level`, `required_skills`, `sourcing`, `scoring_weights`).
  - Fires POST webhook to `process.env.N8N_WEBHOOK_URL` using `axios` (5-second timeout).
  - Graceful fallback: If n8n call fails or times out, job remains saved and active in DB with warning toast: *"Job saved. Automation could not be started — please retry from job settings."*
- Sonner toast notifications & **"Retry Automation"** action on Job Details page.

### 📊 Jobs List & Management (Chunk 6)
- Responsive job postings dashboard at `/jobs` with 2-column grid layout and filter tabs (`All`, `Active`, `Paused`, `Closed`, `Draft`).
- Search input filter by title or location.
- Backend API `GET /api/jobs`: Returns jobs belonging to authenticated HR Manager with `_count: { candidates: true }`, sorted by `createdAt` desc, supports status filtering (`GET /api/jobs?status=active`).
- Backend API `PATCH /api/jobs/:id/status`: Accepts `{ action: "pause" | "close" | "reopen" }`. Executes a Prisma `$transaction` updating status and inserting audit logs in `job_status_logs`. Reopening triggers n8n webhook (`event: "job_reopened"`).
- `JobCard` component features color-coded status badges, `date-fns` formatted creation date (`"12 Aug 2025"`), candidate counts, `DropdownMenu` status actions, optimistic UI updates, and Sonner toast alerts.

### 👥 Candidate Pipeline Dashboard (Chunk 7)
- Candidate Pipeline Dashboard embedded on `/jobs/[jobId]` view.
- Backend API `GET /api/jobs/:jobId/candidates`:
  - Validates HR Manager job ownership.
  - Supports query filters: `minScore`, `maxScore`, `source` (`linkedin`, `upwork`, `indeed`), `stage` (`sourced`, `screened`, `interviewed`, `shortlisted`, `rejected`), `page`, and `limit`.
  - Joins `candidates` with `candidate_scores`, ordered by `compositeScore` descending.
  - Returns paginated candidate array and pipeline stage metrics.
- Candidate Pipeline UI (`CandidatePipelineDashboard`):
  - Top 4 Metric Tiles: Total Sourced | Screened | Shortlisted | Rejected.
  - Horizontal Filter Bar: Score Range Inputs (0–10), Source Platform dropdown, Stage dropdown, "Apply Filters", and "Reset".
  - Candidate Cards: Full Name, Source Badge (LinkedIn: Blue, Upwork: Green, Indeed: Orange), Composite Score (`"9.2 / 10"`) with visual `Progress` bar, Stage Badge, AI Summary text block, and "View Profile" action.
  - Pagination ("Load More" button & candidate count text), Skeleton loading state, and centered empty state.

### 👤 Candidate Detail View (Chunk 8)
- Full-page candidate profile screen at `/jobs/[jobId]/candidates/[candidateId]`.
- Backend API `GET /api/candidates/:candidateId`:
  - Validates candidate job ownership.
  - Returns relations: `scores`, `assessmentSubmission`, `interviewSession`, `job.scoringWeights`.
- Candidate Detail UI:
  - Header: Back button (`Back to Pipeline`), Full Name, Stage Badge, Top Right Action Buttons (`Shortlist`, `Hold`, `Reject`).
  - Tab 1 (Profile & Resume): Info grid, normalized skill badges, PDF iframe embed or S3 download button.
  - Tab 2 (Assessment Test): Prominent test score (`"72 / 100"`) & per-question evaluation breakdown table (`Question #`, `Question Text`, `Candidate Answer`, `Score`, `Max Score`, `Justification`).
  - Tab 3 (AI Interview): Prominent interview score & conversational dialogue thread (AI left gray bubble vs Candidate right blue bubble).
  - Tab 4 (Scores & Summary): Large Composite Fit Score (`"8.7 / 10"`), 3 weighted progress bars (Resume Match 30%, Skills Test 40%, AI Interview 30%), AI summary card, green Strengths pills, and orange Weaknesses pills.

### ⚡ Shortlist / Reject / Hold Actions (Chunk 9)
- Candidate action buttons (`Shortlist` ✅, `Hold` ⏸, `Reject` ❌) present on both candidate cards and detail view.
- Backend API `POST /api/candidates/:candidateId/action`:
  - Validates HR Manager job ownership.
  - Guards against double-action (`400 Bad Request` if candidate is already in requested state).
  - Maps actions (`shortlist` -> `shortlisted`, `reject` -> `rejected`, `hold` -> `on_hold`).
  - Executes Prisma `$transaction` updating candidate status and creating an audit record in `candidate_status_logs`.
  - Triggers n8n webhook POST to `N8N_WEBHOOK_URL` (`event: "candidate_action"`, candidate, job, company, HR details) to send candidate emails.
- Action Buttons Component (`ActionButtons.tsx`):
  - Button state management: Shortlist (Green filled when active), Hold (Gray filled when active), Reject (Red filled when active).
  - Reject Confirmation Modal: `shadcn` Dialog (`"Reject this candidate?"`, `"This will send a rejection email to [Candidate Name]. This action cannot be undone."`).
  - Displays Sonner toasts for success, warning, and error states.

### 📈 Analytics & Reporting (Chunk 10)
- Job Analytics & Reporting Dashboard at `/jobs/[jobId]/analytics`.
- Backend API `GET /api/analytics/:jobId`:
  - Computes recruitment funnel metrics with stage conversion rates (`Sourced` -> `Screened` -> `Interviewed` -> `Shortlisted`).
  - Aggregates score metrics (Average Score, Highest Score, Lowest Score).
  - Analyzes source platform performance and identifies the best performing channel.
  - Performs skill gap analysis comparing JD required skills vs candidates' skills.
  - Computes average time to shortlist from `candidate_status_logs`.
- Backend API `GET /api/analytics/:jobId/export`:
  - Streams downloadable candidate dataset CSV file with RFC 4180 formatting.
- Analytics UI:
  - Recharts `BarChart` of source performance.
  - Recruitment funnel stage cards with conversion percentages.
  - Top missing skills gap table.
  - Average time to shortlist metric tile.
  - Skeleton loading states and CSV export action button.

### ⚙️ Account & App Settings (Chunk 11)
- HR Manager Settings screen at `/settings` and `/dashboard/settings`.
- Backend API `GET /api/settings`: Returns HR Manager profile (`name`, `email`) + `preferences` (`defaultWeights`, `notifyPipeline`, `notifyComplete`).
- Backend API `PATCH /api/settings/profile`: Updates display name immediately. If email is changed, checks email uniqueness across accounts, creates a 24h verification token in `password_reset_tokens`, and dispatches a verification email via Resend.
- Backend API `PATCH /api/settings/password`: Validates current password using `bcrypt.compare()` and updates `passwordHash` (`bcrypt.hash(newPassword, 12)`).
- Backend API `PATCH /api/settings/preferences`: Enforces 100% total weight sum validation and upserts `hr_preferences`. Pre-fills new job creation forms automatically.
- Settings UI:
  - **Tab 1 — Profile & Password**: Form for display name & email (with verification info banner), and separate Password Change form with current password validation.
  - **Tab 2 — Default Scoring Weights**: 3 weight sliders (Resume Match, Skills Test, AI Interview) summing to 100% with auto-rebalancing logic and live indicator badge (`Total: 100% ✅`).
  - **Tab 3 — Notifications**: 2 auto-saving toggle switches (`Switch` components) for pipeline candidate notifications and job completion notifications.

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
│   │   │       │   └── page.tsx         # Job Analytics & Reports Page (Chunk 10)
│   │   │       └── candidates/
│   │   │           └── [candidateId]/
│   │   │               └── page.tsx     # Full Candidate Detail Profile Page (Chunk 8)
│   │   ├── settings/
│   │   │   └── page.tsx                 # HR Account Settings Page (Chunk 11)
│   │   └── layout.tsx                   # Dashboard navigation sidebar & navbar shell
│   ├── reset-password/page.tsx          # Set new password page
│   └── api/
│       ├── settings/
│       │   ├── route.ts                 # Settings GET API (Chunk 11)
│       │   ├── profile/route.ts         # Profile PATCH API (Chunk 11)
│       │   ├── password/route.ts        # Password PATCH API (Chunk 11)
│       │   └── preferences/route.ts     # Preferences PATCH API (Chunk 11)
│       ├── analytics/
│       │   └── [jobId]/
│       │       ├── route.ts             # Analytics GET API (Chunk 10)
│       │       └── export/route.ts      # CSV Export GET API (Chunk 10)
│       ├── candidates/
│       │   └── [candidateId]/
│       │       ├── route.ts             # Candidate Detail GET API (Chunk 8)
│       │       └── action/route.ts      # Candidate Action POST API (Chunk 9)
│       └── jobs/
│           ├── route.ts                 # Jobs GET / POST API
│           └── [jobId]/
│               ├── candidates/route.ts  # Candidate Pipeline GET API
│               ├── launch/route.ts      # Job Launch & n8n webhook API
│               ├── status/route.ts      # Job status update & audit logging API
│               └── weights/route.ts     # Scoring weights PATCH API
```

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Validate & sync Prisma schema:**
   ```bash
   npx prisma validate
   npx prisma db push
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the app:**
   Open [http://localhost:3000/login](http://localhost:3000/login)

## Seeded HR Credentials
- **Email**: `ahmad@gmail.com`
- **Password**: `Admin@123`
