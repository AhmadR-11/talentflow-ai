# TalentFlow AI Agent Guide

## Project purpose
This repository is a TalentFlow HR platform built with Next.js App Router, Prisma ORM, PostgreSQL (Neon), and NextAuth credentials auth.

The app is centered on HR login, dashboard access, job posting management, candidate flows, and password reset flow.

## Stack
- Framework: Next.js 16
- App Router: yes
- React: 19
- TypeScript: yes
- Styling: Tailwind CSS + shadcn/ui components
- Auth: NextAuth v5 credentials strategy
- DB: PostgreSQL via Neon
- ORM: Prisma 7
- Email: Resend
- Runtime: Node.js

## Important project facts
- Use App Router conventions, not pages router assumptions.
- The app uses `src/proxy.ts` as the Next.js 16 replacement for the older `middleware.ts` pattern.
- `src/auth.ts` contains the global auth configuration and credentials provider.
- Auth-protected dashboard routes are under `src/app/(dashboard)`.
- Public auth routes are under `src/app/(auth)`.
- Prisma models live in `prisma/schema.prisma`.
- Database config is managed in `prisma.config.ts` and the Prisma client in `src/lib/prisma.ts`.
- The runtime database URL is from Neon and should be stored in `.env`.

## Project structure
- `src/app/` — route pages and App Router layout
- `src/app/(auth)/login/page.tsx` — HR login screen
- `src/app/(auth)/forgot-password/page.tsx` — reset request page
- `src/app/reset-password/page.tsx` — set a new password using reset token
- `src/app/(dashboard)/dashboard/page.tsx` — protected dashboard landing page
- `src/auth.ts` — NextAuth config and credentials validation
- `src/proxy.ts` — route protection logic for dashboard routes
- `src/lib/prisma.ts` — Prisma client initialization with Prisma 7 adapter pattern
- `prisma/schema.prisma` — Prisma schema / models
- `.env` — local environment values including `DATABASE_URL` and `NEXTAUTH_SECRET`

## Database and Prisma rules
- Prisma v7 requires the datasource to omit the `url` field from `schema.prisma`.
- Connection URL belongs in `prisma.config.ts` and/or in the Prisma client adapter setup.
- The project is intended for PostgreSQL, specifically Neon-hosted Postgres.
- Do not assume `localhost` is the database host for production runtime.
- Treat `DATABASE_URL` as required for all Prisma access.

## Auth rules
- Credentials login checks `HrManager.email` and `HrManager.passwordHash`.
- Passwords are verified using `bcryptjs`.
- Protected pages are under `/dashboard` and should redirect to `/login` if unauthenticated.
- Session cookie name is `talentflow_session`.
- Use `auth()` to read the session in server components and route checks.

## Core commands
- Install deps: `npm install`
- Start app: `npm run dev`
- Type-check: `npx tsc --noEmit`
- Sync Prisma schema to DB: `npx prisma db push`
- Validate Prisma schema: `npx prisma validate`

## Environment values expected
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`
- `UPLOADTHING_SECRET`
- `UPLOADTHING_APP_ID`

## Local runtime note
If `npm run dev` fails with `EPERM` on port 3000 inside the VS Code sandbox, run it from a normal terminal outside the VS Code sandbox when needed.

This is a runtime environment restriction, not a code bug.

## Important conventions for AI agents
- Do not rename Prisma models without updating relations and mappings.
- Do not change auth flow without preserving the `HrManager` email/password behavior.
- Keep protected routes inside `src/app/(dashboard)`.
- Preserve the existing App Router grouping structure unless specifically requested.
- Prefer minimal, targeted edits over broad refactors.
- If changing Prisma schema, run `npx prisma validate` and `npx prisma db push`.
- Do not remove or rewrite the project structure unless the task clearly requires it.

## Database model highlights
- `HrManager` — HR user account, email, passwordHash
- `PasswordResetToken` — password reset tokens for login recovery
- `JobPosting` — hiring posts
- `Candidate` — candidate records
- `AssessmentSubmission` — candidate assessment answers
- `InterviewSession` — interview session data
- `HrPreference` — HR preferences

## Login credentials seed
The application expects a seeded HR manager account. The usual seeded user is:
- email: `ahmad@gmail.com`
- password: `Admin@123`

This is stored in the `hr_managers` table in PostgreSQL.

## Do not do
- Do not reintroduce the deprecated `src/middleware.ts` convention in Next.js 16.
- Do not use plain `new PrismaClient()` without the Prisma 7 adapter pattern for direct Postgres access.
- Do not assume `localhost` is the DB host for real app runtime.
- Do not remove the route groups and login flows unless asked.

## Summary
This app is a working HR hiring system scaffold with protected dashboard routes, credentials-based auth, password reset flow, and Neon-backed Prisma Postgres persistence. Keep the stack and conventions aligned with Next.js 16 and Prisma 7 when making changes.
