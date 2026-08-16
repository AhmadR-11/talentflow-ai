# TalentFlow AI

TalentFlow AI is a Next.js 16 HR hiring platform for managing job postings, candidates, assessments, and secure HR login flows.

## Stack
- Next.js 16
- React 19
- TypeScript
- Prisma 7
- PostgreSQL (Neon)
- NextAuth v5 credentials auth
- Tailwind CSS + shadcn/ui

## Core features
- HR login with credentials
- Dashboard protection for authenticated HR users
- Password reset flow
- Job posting and candidate management structure
- Neon-backed Prisma data layer

## Project structure
- `src/app/` — App Router pages and route groups
- `src/app/(auth)/login/page.tsx` — HR login page
- `src/app/(auth)/forgot-password/page.tsx` — forgot-password flow
- `src/app/reset-password/page.tsx` — token-based password reset page
- `src/app/(dashboard)/dashboard/page.tsx` — dashboard landing page
- `src/auth.ts` — NextAuth config and credentials validation
- `src/proxy.ts` — Next.js 16 proxy for protected dashboard routes
- `src/lib/prisma.ts` — Prisma client with adapter setup
- `prisma/schema.prisma` — Prisma schema
- `.env` — app and database environment variables

## Environment variables
Create a `.env` file with values like:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RESEND_API_KEY="your-resend-key"
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-id"
```

## Local setup

Install dependencies:

```bash
npm install
```

Validate and sync Prisma schema:

```bash
npx prisma validate
npx prisma db push
```

Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/login
```

## Default HR login
The project expects a seeded HR user. A typical seeded account is:

- Email: `ahmad@gmail.com`
- Password: `Admin@123`

This account is stored in the `hr_managers` table in PostgreSQL.

## Important project conventions
- Use the Next.js App Router pattern.
- Use `src/proxy.ts` instead of the deprecated `middleware.ts` file.
- Prisma v7 does not use the deprecated `datasource url` field in `schema.prisma`.
- Keep protected dashboard routes under `src/app/(dashboard)`.
- Use `auth()` and `signOut()` for session checks and logout behavior.

## Notes
- If port 3000 is blocked by the local environment, run the app from a normal macOS terminal outside the VS Code sandbox.
- The app uses Neon Postgres and expects a real `DATABASE_URL` in `.env`.
