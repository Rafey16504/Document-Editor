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

## 2026-10-29 — README

**Goal:** Add a project README (brought forward from session 7).

**Done:**
- `README.md`: features, supported import types and limits, demo users, local setup, env vars, tests, structure, scope, links to docs

**Decisions made:** none

**Issues / blockers:**
- Live URL is a placeholder until deploy (session 6)

**Next steps:**
- [ ] Session 6: add the live URL to `README.md`
- [ ] Session 7: review README against the brief's deliverables

---

## 2026-10-29 — Session 5: tests + hardening

**Goal:** Vitest unit tests (access rules, import conversion, validation), Playwright smoke test of the main flow, error/empty/loading states.

**Done:**
- Added `vitest@^4`, `@playwright/test`; scripts `test`, `test:e2e` (`package.json`); `e2e.db*`, `test-results`, `playwright-report` ignored
- Unit setup: in-memory libSQL with schema pushed from `schema.ts` (`vitest.config.mts`, `tests/setup.ts`, `tests/helpers.ts`)
- 45 unit tests: `tests/access.test.ts` (getAccess/requireAccess 404 vs 403, read/update/delete per role, cascade, lists), `tests/shares.test.ts` (grant, role change, unknown email, self-share, owner-only, idempotent revoke), `tests/import.test.ts` (importExtension, textToDoc, htmlToDoc, convertFile per type + errors), `tests/validation.test.ts` (schemas, readJson, handle, session tokens)
- Fixtures `tests/fixtures/`: `sample.md`, `sample.docx`, `empty.docx`, `corrupt.docx` (docx built once with jszip)
- E2E: `playwright.config.ts` (build + start on :3210, `file:e2e.db`), `tests/e2e/prepare-db.ts` (reset + push + seed, refuses any other DB), `tests/e2e/smoke.spec.ts` (4 tests: create → format → rename → reload → share with Bob as editor → Bob sees "Can edit", opens, edits, persists; Markdown import; .pdf / empty file errors, empty "Shared with me", doc not-found page; logged-out redirect)
- Page states: `src/app/(app)/loading.tsx`, `error.tsx` (Next 16 `retry` prop), `documents/[id]/not-found.tsx`
- Verified: `npm test` 45/45, `npm run test:e2e` 4/4, `tsc`, lint, Prettier (`--end-of-line auto`) clean. Mutation check: making `getAccess` return "owner" for everyone fails 15 tests.

**Bugs found and fixed while testing:**
- Toolbar stayed blank until the first click in the editor (e.g. a shared doc opened from the dashboard): `useEditorState` started with a null editor and only re-read on a transaction. Split into a wrapper that mounts the stateful toolbar once the editor exists (`src/components/editor-toolbar.tsx`).
- Logged-out visits logged a server `TypeError` (null user): Next renders layout and page concurrently, so pages using `getCurrentUser()!` ran despite the layout redirect. Added `requirePageUser()` (`src/server/session.ts`), used in the `(app)` layout and both pages.

**Decisions made:** D-014

**Issues / blockers:**
- A `next start -p 3100` started at 16:27 (likely session 4 testing) was still running, so e2e uses port 3210. Stop it if it's not needed.
- Working-copy files have CRLF line endings, so plain `prettier --check .` flags ~50 untouched files; use `--end-of-line auto` locally. Committed files are unaffected.
- `error.tsx` isn't covered by a test (no safe way to force a server error in the build); checked by build and typecheck only.

**Next steps:**
- [ ] User: create branch `session-5-tests`, commit, push, merge to `main`; `npx playwright install chromium` on any new machine
- [ ] Session 6: deploy (Turso + Vercel); optionally run the smoke spec against the live URL by overriding `baseURL`
- [ ] Session 7: README test instructions (`npm test`, `npm run test:e2e`) and import limits

---

## 2026-10-29 — Session 4: file import

**Goal:** `POST /api/documents/import` for .txt/.md/.docx (2 MB), HTML → Tiptap JSON, upload UI with stated limits and error states.

**Done:**
- Added `@tiptap/html`, `@tiptap/core`, `happy-dom`, `mammoth`, `marked` (`package.json`)
- Shared rules `IMPORT_EXTENSIONS`, `IMPORT_MAX_BYTES`, `importExtension()` (`src/lib/import-rules.ts`)
- `convertFile()`, `textToDoc()`, `htmlToDoc()` (`src/server/import.ts`); `createDocument(userId, init?)` (`src/server/documents.ts`)
- Import route with Content-Length pre-check, form/file validation (`src/app/api/documents/import/route.ts`)
- `MAX_DOCUMENT_BYTES` = 4 MB shared by PATCH and import (`src/lib/validation.ts`, `src/app/api/documents/[id]/route.ts`)
- "Import file" button + limits hint on the dashboard (`src/components/import-document-button.tsx`, `src/app/(app)/page.tsx`)
- Verified: `tsc`, lint, Prettier, `next build` clean. curl against `next start`: .txt (BOM, CRLF, line breaks, `<b>` kept as literal text), .md (headings, marks, nested lists, quote, code block, hr; script/image/link dropped, table flattened), .docx (H1/H2, bold/italic/underline, bullet + numbered lists; table flattened, image dropped), `.TXT` uppercase → 201 with filename title; empty/whitespace, image-only .docx → 400 "File is empty"; corrupt .docx 400; .pdf / no extension 400; 2 MB + 1 byte 413; 1.9 MB of one-char lines 413 (JSON > 4 MB); no file field 400; JSON body 400; anon 401; PATCH 3.9 MB 200, 4.1 MB 413. Playwright: each type imported via the button → opens editor with content → edit autosaves → survives reload; .pdf / >2 MB / empty / corrupt show the dashboard error.

**Bugs found and fixed while testing:**
- mammoth drops underline by default → `styleMap: ["u => u"]` (`src/server/import.ts`).

**Decisions made:** D-012, D-013

**Issues / blockers:**
- The already-running `next dev` on :3000 kept serving the old `createDocument` after `npm install` (imports got default title/empty content); a fresh build was correct. Restart the dev server after pulling.
- A document holding one 3.9 MB text node froze the browser tab: the size limit allows docs the editor renders slowly. Realistic imports are far smaller.
- Imported Markdown images/tables leave an empty paragraph or flattened text; acceptable per D-006.
- Requests without Content-Length are parsed before the 2 MB file check (bounded by Vercel's 4.5 MB cap).

**Next steps:**
- [ ] User: create branch `session-4-import`, commit, push, merge to `main`; restart `npm run dev`
- [ ] Session 5: unit-test `textToDoc`, `convertFile` (each type + error cases, fixtures in `tests/fixtures/`), `importExtension`; e2e import via the file input
- [ ] Session 7: state import limits (types, 2 MB, images/tables/links dropped) in README

---

## 2026-10-29 — Session 3: sharing

**Goal:** Shares API (grant by email, role change, revoke), share dialog, "Shared with me" list with role badges, viewer limits.

**Done:**
- `shareSchema` (email trimmed + lowercased, role viewer/editor), `SHARE_ROLES`, `Share` type (`src/lib/validation.ts`)
- `listShares` / `upsertShare` / `revokeShare`, all owner-only via `requireAccess(CAN_MANAGE)`; unknown email 404, self-share 400, revoke idempotent (`src/server/shares.ts`)
- `GET/POST /api/documents/:id/shares`, `DELETE /api/documents/:id/shares/:userId` (`src/app/api/documents/[id]/shares/**`)
- `listSharedDocuments()` with owner name + role (`src/server/documents.ts`); dashboard "Shared with me" section with empty state, no Delete on shared docs (`src/app/(app)/page.tsx`)
- Share dialog (`src/components/share-dialog.tsx`), role badge (`src/components/role-badge.tsx`); editor header shows Share for owners, badge for others, no save status for viewers (`src/components/document-editor.tsx`)
- Verified: `tsc`, lint, Prettier, `next build` clean. Scripted curl checks, 36/36 (401 anon; 400 bad JSON/email/role/self; 404 unknown email, no-access user, unknown doc, after revoke/delete; 403 viewer/editor on shares API and DELETE doc, viewer PATCH; upsert role change; sorted list; idempotent revoke). Playwright, 27/27: Alice shares with Bob as viewer → Bob sees it under "Shared with me" with badge and owner, read-only editor with no toolbar; upgrade to editor → Bob's edit reaches Alice; revoke → Bob's open tab shows "Save failed: Document not found", page 404s, list no longer shows it; dialog errors for unknown email / self-share.

**Decisions made:** none (POST upsert for grant + role change, noted in `ARCHITECTURE.md`)

**Issues / blockers:**
- Access changes aren't pushed to open tabs; affected users find out on their next save (consistent with D-009).
- API and browser checks were scripted by hand; not yet in the test suite.

**Next steps:**
- [ ] User: create branch `session-3-sharing`, commit, push, merge to `main`
- [ ] Session 4: file import (`POST /api/documents/import`, .txt/.md/.docx, 2 MB)
- [ ] Session 5: unit-test `shareSchema` and `upsertShare`/`revokeShare`/`listSharedDocuments`; e2e for share → second user sees it (the Playwright flow above is a good template)

---

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
