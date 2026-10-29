# Work Log

Chronological record of development sessions. **Newest entries at the top.**

---

<!-- Copy this template for each new session and paste it directly below this line.

## YYYY-MM-DD — <short session title>

**Goal:** <what this session set out to do>

**Done:**
- <change> (`path/to/file`)

**Decisions made:** <D-XXX, D-YYY, or "none">

**Issues / blockers:**
- <problem and status, or "none">

**Next steps:**
- [ ] <follow-up task>

---
-->

## 2026-10-29 — Session 1: scaffold, DB, auth

**Goal:** Next.js scaffold, Drizzle schema + libSQL, seed script, mocked login with signed cookie session, error helpers.

**Done:**
- Scaffolded Next 16.4 + React 19 + Tailwind 4 + ESLint/Prettier; removed starter assets (`package.json`, `next.config.ts`, `eslint.config.mjs`, `.prettierrc.json`)
- Schema for users / documents / document_shares, libSQL client, idempotent seed of alice/bob/carol (`src/server/db/*`)
- Scripts load `.env.local` via `@next/env` (`src/server/db/load-env.ts`); `.env.example` added; `.gitignore` keeps `.env.example`, ignores `local.db*`
- `AppError` + `handle()` / `readJson()` route helpers (`src/server/errors.ts`, `src/server/route.ts`)
- HMAC-signed session cookie with expiry, `getCurrentUser` / `requireUser` (`src/server/session.ts`)
- `POST/DELETE /api/session`, login page with user picker, protected `(app)` layout with header + logout, placeholder home (`src/app/**`, `src/components/*`)
- Verified: `tsc`, lint, `next build` clean; `db:push` + `db:seed` (x2, no duplicates); curl checks for logged-out redirect, bad JSON/invalid body (400), unknown user (404), login cookie flags, tampered/forged/expired cookies → `/login`, logout clears cookie; browser click-through login as Alice → logout

**Decisions made:** D-007 (Tailwind), D-008 (Cache Components off)

**Issues / blockers:**
- `npm audit`: 4 moderate advisories in esbuild via drizzle-kit (dev-only tooling); left as is.
- `tsc --noEmit` alone fails on `LayoutProps` until `next typegen` (or a build) has run; documented in `CLAUDE.md`.

**Next steps:**
- [ ] User: create branch `session-1-scaffold-auth`, commit, merge to `main`
- [ ] Session 2: dashboard, documents API, Tiptap editor, autosave, rename (`src/app/(app)/page.tsx` placeholder gets replaced)

---

## 2026-10-29 — Scope, design and project guardrails

**Goal:** Analyze the assessment brief, agree on stack and scope, set up docs and guardrails.

**Done:**
- Agreed scope and stack with user; recorded D-001..D-006 (`docs/DECISIONS.md`)
- Filled conventions (`docs/CODING_PRACTICES.md`)
- Added living architecture doc with local run steps (`docs/ARCHITECTURE.md`)
- Added git-guard PreToolUse hook blocking git writes (`.claude/hooks/git-guard.js`, `.claude/settings.json`); 20/20 sample commands behave as expected
- Split remaining work into 7 per-chat sessions with kickoff prompts (`docs/SESSION_PLAN.md`); saved brief to `docs/BRIEF.md`

**Decisions made:** D-001, D-002, D-003, D-004, D-005, D-006

**Issues / blockers:**
- Hook matches command text, so commands merely mentioning a git write (e.g. in an echo) are also blocked — intentional, conservative.

**Next steps:**
- [ ] New chat: session 1 (scaffold, DB, auth) per `docs/SESSION_PLAN.md`
- [ ] User: create Turso DB + Vercel project when ready to deploy

---
