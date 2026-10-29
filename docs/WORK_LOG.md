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

## 2026-10-29 — Session 2: documents + editor

**Goal:** Dashboard, create/get/update/delete documents, Tiptap editor with toolbar, debounced autosave, inline rename.

**Done:**
- Added Tiptap 3.32.1 (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`) and `@tailwindcss/typography` (`package.json`, `src/app/globals.css`)
- Shared extension list and defaults (`src/lib/editor-extensions.ts`, `src/lib/document-defaults.ts`); `updateDocumentSchema` (`src/lib/validation.ts`); client error helper (`src/lib/api-client.ts`)
- `getAccess()` / `requireAccess()` with full owner/editor/viewer rules (`src/server/access.ts`); document service (`src/server/documents.ts`); `readJson()` now caps body size → 413 (`src/server/route.ts`)
- `POST /api/documents`, `GET/PATCH/DELETE /api/documents/[id]` (`src/app/api/documents/**`)
- Dashboard with empty state, New and Delete buttons (`src/app/(app)/page.tsx`, `src/components/new-document-button.tsx`, `delete-document-button.tsx`)
- Editor page, editor, toolbar, autosave hook (`src/app/(app)/documents/[id]/page.tsx`, `src/components/document-editor.tsx`, `editor-toolbar.tsx`, `use-autosave.ts`)
- Verified: `tsc`, lint, Prettier (content), `next build` clean. curl: 21 API checks (401 anon; 400 for empty/bad body, bad JSON, title >200; 413 for >1 MB; 404 for other user / unknown id / page; viewer PATCH 403, editor PATCH 200, editor DELETE 403, owner DELETE 204, shares cascade). Playwright: create → rename → H1/H2/B/I/U/lists/undo/redo → reload shows identical HTML; failed save shows "Save failed" + Retry and recovers; leaving before the debounce still saves and Back shows fresh content; blank title becomes "Untitled document"; delete with confirm removes the row.

**Bugs found and fixed while testing:**
- Toolbar buttons took focus, so the first keystrokes after a click hit the button (Space re-toggled Bold) → `onMouseDown` preventDefault (`src/components/editor-toolbar.tsx`).
- Back after leaving the editor showed Next's cached (stale) page, which would autosave over newer content → `router.refresh()` after the final flush (`src/components/document-editor.tsx`).

**Decisions made:** D-009 (autosave), D-010 (no list API yet), D-011 (`getAccess()` moved to session 2)

**Issues / blockers:**
- Files from session 1 are CRLF in the working tree (Windows checkout), so `prettier --check` reports them; content is formatted (`--end-of-line auto` passes). Consider a `.gitattributes` with `* text=auto eol=lf`.
- Two users editing the same doc at the same time: last write wins (D-009).
- No automated tests yet (session 5); checks above were scripted by hand.

**Next steps:**
- [ ] User: create branch `session-2-editor`, commit, push, merge to `main`
- [ ] Session 3: shares API + share dialog, "Shared with me" list (server-rendered per D-010), role badges, viewer mode (`DocumentEditor` already takes `role` and goes read-only for viewers)
- [ ] Session 5: unit-test `getAccess`/`requireAccess`, `updateDocumentSchema`, `readJson` limits; e2e for create → format → reload

---

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
