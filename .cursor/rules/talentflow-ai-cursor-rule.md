<!-- ---
trigger: glob
globs: "**/*.ts,**/*.tsx,**/*.css,**/*.prisma"
description: Proactively apply changes and sync TalentFlow AI dev environment on every file edit
---

# TalentFlow AI — Cursor Auto Dev Rule

Whenever you make edits to any `.ts`, `.tsx`, `.css`, or `.prisma` file in this project, follow these steps in order:

---

## 1. Detect File Type & Category

Before doing anything, identify what kind of file was changed:

| File Pattern | Category |
|---|---|
| `src/app/api/**/*.ts` | API Route (backend) |
| `src/app/(auth)/**/*.tsx` | Auth Screen (frontend) |
| `src/app/(dashboard)/**/*.tsx` | HR Dashboard Screen (frontend) |
| `src/app/(candidate)/**/*.tsx` | Candidate Screen (frontend) |
| `src/components/**/*.tsx` | Reusable Component (frontend) |
| `src/lib/**/*.ts` | Library / Client (e.g. prisma, openai, s3) |
| `src/services/**/*.ts` | Service Layer (business logic) |
| `src/types/**/*.ts` | Type Definitions |
| `prisma/schema.prisma` | Database Schema |
| `**/*.css` | Styles |

---

## 2. Run the Correct Action Per File Type

### If `prisma/schema.prisma` was changed:
```bash
npx prisma migrate dev --name auto_migration
npx prisma generate
```
Then inform the user:
> "Prisma schema changed — migration ran and client regenerated. Check for any relation or type errors."

---

### If `src/lib/prisma.ts` was changed:
```bash
npx prisma generate
```
> "Prisma client updated."

---

### If any `src/app/api/**/*.ts` was changed:
1. Check for TypeScript errors in that file:
```bash
npx tsc --noEmit --project tsconfig.json
```
2. If errors found — fix them before proceeding.
3. Remind the user:
> "API route updated. Next.js hot reload will reflect changes automatically on next request. If you added a new route, test it via: `curl http://localhost:3000/api/YOUR_ROUTE`"

---

### If any `src/app/**/*.tsx` or `src/components/**/*.tsx` was changed:
1. Next.js Fast Refresh handles this automatically in dev mode.
2. Check for TypeScript errors:
```bash
npx tsc --noEmit --project tsconfig.json
```
3. If the component uses a shadcn component that hasn't been added yet, run:
```bash
npx shadcn@latest add COMPONENT_NAME
```
4. Inform the user:
> "Component updated — Fast Refresh applied. Check browser for live changes at http://localhost:3000"

---

### If any `src/services/**/*.ts` was changed:
1. Run TypeScript check:
```bash
npx tsc --noEmit --project tsconfig.json
```
2. Remind the user:
> "Service layer updated. Since services are imported by API routes, changes will reflect on next API call. No restart needed."

---

### If any `src/lib/**/*.ts` was changed (openai, s3, redis, n8n, resend, qdrant):
1. Run TypeScript check:
```bash
npx tsc --noEmit --project tsconfig.json
```
2. Warn if `.env.local` variable might be missing:
> "Check that all required environment variables for this lib are present in `.env.local`. Missing keys will cause silent runtime failures."

---

### If any `**/*.css` or `tailwind.config.ts` was changed:
1. Next.js handles CSS hot reload automatically.
2. If new Tailwind classes were added that aren't working, run:
```bash
npm run dev
```
> "CSS updated — Tailwind JIT will pick up new classes automatically."

---

## 3. Always Run After Any Edit

After every file save, always run this silently and report only if errors exist:

```bash
npx tsc --noEmit --project tsconfig.json
```

If TypeScript errors found:
> "TypeScript error detected in [filename] — fix before continuing:
> [ERROR MESSAGE]"

If no errors:
> "✅ No TypeScript errors."

---

## 4. Dev Server Check

If the dev server is NOT running, inform the user and provide the command:

```bash
npm run dev
```

> "Dev server is not running. Start it with `npm run dev` — app will be available at http://localhost:3000"

If the dev server IS running, do not restart it — Next.js Fast Refresh handles all `.tsx` and `.ts` changes automatically without restart.

---

## 5. Database-Related Reminders

If an API route file was changed that contains Prisma queries:
- Check that the Prisma model being queried exists in `prisma/schema.prisma`
- Check that all fields referenced in the query match the schema
- If a new model or field was added to the schema but migration hasn't run yet, remind:

> "New Prisma model/field detected in query. Run migration first:
> `npx prisma migrate dev --name your_migration_name`"

---

## 6. Environment Variable Guard

If any of these lib files are edited, check that their required `.env.local` keys exist:

| File | Required ENV Keys |
|---|---|
| `src/lib/openai.ts` | `OPENAI_API_KEY` |
| `src/lib/resend.ts` | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| `src/lib/s3.ts` | `S3_BUCKET_NAME`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT` |
| `src/lib/redis.ts` | `REDIS_URL` |
| `src/lib/qdrant.ts` | `QDRANT_URL`, `QDRANT_API_KEY` |
| `src/lib/n8n.ts` | `N8N_WEBHOOK_URL`, `N8N_SECRET` |
| `src/lib/auth.ts` | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| `src/lib/prisma.ts` | `DATABASE_URL` |

If a key is missing from `.env.local`, warn immediately:
> "⚠️ Missing ENV key: `KEY_NAME` — add it to `.env.local` before testing this feature."

---

## 7. n8n Webhook Reminder

If `src/app/api/jobs/[jobId]/launch/route.ts` is edited:
> "This file triggers the n8n webhook. If n8n is not running or the webhook URL is invalid, the job will still save to DB — but automation will not start. The error is handled gracefully. Test the webhook separately at: `N8N_WEBHOOK_URL`"

If `src/app/api/webhooks/n8n/route.ts` is edited:
> "This is the inbound webhook receiver from n8n. Make sure the route is publicly accessible (use ngrok in local dev) so n8n can reach it: `npx ngrok http 3000`"

---

## 8. If No Dev Server Is Running

Do NOT stop completing the code edits.
Always finish the full edit first, then inform:

> "✅ Code edits complete. Dev server is not running — start it with:
> `npm run dev`
> Then open http://localhost:3000 to see your changes."

---

## Quick Reference — All Dev Commands

```bash
# Start dev server
npm run dev

# TypeScript check (no emit)
npx tsc --noEmit

# Prisma — after schema change
npx prisma migrate dev --name migration_name
npx prisma generate

# Prisma Studio — view DB in browser
npx prisma studio

# Add new shadcn component
npx shadcn@latest add COMPONENT_NAME

# Install new package
npm install PACKAGE_NAME

# Build for production
npm run build

# Local tunnel for n8n webhooks
npx ngrok http 3000
``` -->