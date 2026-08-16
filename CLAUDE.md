# Claude Project Guide

This file is the Claude-specific entry point for this repository.

It intentionally includes and extends the shared project guidance in `AGENTS.md`.

## Scope
Claude should operate as a project-aware coding assistant for this TalentFlow AI repository.

## Shared instructions
- Read `AGENTS.md` first for project-wide rules and conventions.
- Maintain compatibility with the current stack: Next.js 16, React 19, Prisma 7, Postgres/Neon, NextAuth v5 credentials auth.
- Follow project-specific route and folder conventions.

## Project specifics
- App Router is the primary pattern.
- Use `src/proxy.ts` instead of old middleware conventions.
- Keep dashboard auth checks in `src/proxy.ts` or in server components that call `auth()`.
- Do not assume mock data or a local DB is available; the app expects Neon Postgres in `.env`.
- Use `npx prisma db push` after making schema changes.
- Verify with `npx tsc --noEmit` before finalizing project changes.

## Expected flow
1. Understand the route group and protected route context.
2. Preserve HR login and dashboard security rules.
3. If database model changes are needed, update Prisma schema and sync to Neon.
4. Keep password reset and login flows working together.
5. Prefer minimal edits and keep the app production-safe.

## Quick references
- Login page: `src/app/(auth)/login/page.tsx`
- Dashboard page: `src/app/(dashboard)/dashboard/page.tsx`
- Auth config: `src/auth.ts`
- Proxy config: `src/proxy.ts`
- Prisma schema: `prisma/schema.prisma`
- Data client: `src/lib/prisma.ts`

## Important reminders
- `middleware.ts` is deprecated; `proxy.ts` is the current pattern.
- Prisma 7 uses a different datasource pattern than older Prisma versions.
- Neon connection string must be in `.env` as `DATABASE_URL`.
- If the app fails to bind to port 3000 due to sandbox restrictions, run from a plain macOS terminal outside the VS Code sandbox.

@AGENTS.md
