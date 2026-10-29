# Decisions

Important decisions made during development, with the reasoning behind them. Entries are never deleted — if a decision is reversed, mark it `Superseded` and link the new one.

## Index

| ID | Date | Decision | Status |
|----|------|----------|--------|
| D-001 | 2026-10-29 | Next.js (App Router) + TypeScript monorepo-free single app | Accepted |
| D-002 | 2026-10-29 | Tiptap editor, content stored as ProseMirror JSON | Accepted |
| D-003 | 2026-10-29 | Drizzle + libSQL: local SQLite file, Turso in production, deployed on Vercel | Accepted |
| D-004 | 2026-10-29 | Mocked auth: seeded users, pick-to-login, signed cookie session | Accepted |
| D-005 | 2026-10-29 | Sharing model: owner + per-user grants with viewer/editor role | Accepted |
| D-006 | 2026-10-29 | File upload = import .txt/.md/.docx into a new document | Accepted |
| D-007 | 2026-10-29 | Tailwind CSS for styling | Accepted |
| D-008 | 2026-10-29 | Next 16 with Cache Components turned off | Accepted |
| D-009 | 2026-10-29 | Debounced, serialized whole-document autosave; last write wins | Accepted |
| D-010 | 2026-10-29 | Server components read document lists directly; no list API yet | Accepted |
| D-011 | 2026-10-29 | `getAccess()` built in session 2 (moved up from session 3) | Accepted |

<!-- Status values: Proposed | Accepted | Superseded by D-XXX | Rejected -->

---

## D-001: Next.js (App Router) + TypeScript

- **Date:** 2026-10-29
- **Status:** Accepted

**Context:** Need frontend, backend API and persistence within a 4–6h timebox, with one deployable artifact.

**Options considered:**
1. Next.js full stack: UI + route handlers in one app, one deploy.
2. Vite React + Express: clearer FE/BE split, but two deploys and more glue.
3. Next.js + Supabase: real auth, but reviewers would need a Supabase project locally.

**Decision:** Next.js App Router with TypeScript (strict).

**Why:** Least glue code, one deploy target, typed end to end.

**Consequences:** Backend logic lives in `src/server/` and is called from route handlers; keep it framework-agnostic so it is unit-testable.

---

## D-002: Tiptap editor, content as JSON

- **Date:** 2026-10-29
- **Status:** Accepted

**Context:** Need bold/italic/underline/headings/lists with a coherent editing experience.

**Options considered:**
1. Tiptap (ProseMirror): mature, headless, structured JSON document model.
2. Lexical: capable, but more setup for lists/headings toolbar state.
3. contentEditable + execCommand: deprecated API, inconsistent output.

**Decision:** Tiptap StarterKit + Underline; persist ProseMirror JSON.

**Why:** Structured JSON preserves formatting exactly and avoids storing/sanitizing raw HTML from the client.

**Consequences:** Imports (md/docx) are converted to HTML server-side, then to Tiptap JSON via `@tiptap/html` with the same extension set, so only supported nodes survive.

---

## D-003: Drizzle + libSQL (SQLite locally, Turso in prod), Vercel

- **Date:** 2026-10-29
- **Status:** Accepted

**Context:** Persistence must survive refresh and work on a free deployment. Vercel's filesystem is ephemeral, so a plain SQLite file cannot be used in production.

**Options considered:**
1. libSQL: `file:local.db` locally (zero setup), Turso hosted DB in prod; same driver.
2. Postgres (Neon): robust, but local setup needs Docker or a cloud URL.
3. JSON file store: simplest, but not viable on Vercel.

**Decision:** Drizzle ORM over `@libsql/client`; `DATABASE_URL` switches between local file and Turso.

**Why:** Reviewers run locally without installing a DB; prod is free and persistent.

**Consequences:** SQLite feature set only (fine for this scope). Schema pushed with `drizzle-kit push`; seed script creates demo users.

---

## D-004: Mocked auth with seeded users

- **Date:** 2026-10-29
- **Status:** Accepted

**Context:** Sharing must be demonstrable; real auth is out of scope for the timebox.

**Options considered:**
1. Pick-a-seeded-user login, signed HTTP-only cookie.
2. Email + shared demo password.
3. OAuth provider.

**Decision:** Option 1. Session cookie holds the user id, HMAC-signed with `SESSION_SECRET`.

**Why:** Zero friction for reviewers switching between accounts; still enforces identity server-side.

**Consequences:** Not secure as real auth (anyone can be anyone) — documented clearly. All access checks still happen on the server, so swapping in real auth only changes the login route.

---

## D-005: Sharing model — owner + viewer/editor grants

- **Date:** 2026-10-29
- **Status:** Accepted

**Context:** Need an owner, a way to grant access, and an owned/shared distinction.

**Options considered:**
1. Owner column + `document_shares(document_id, user_id, role)` with `viewer | editor`.
2. Single "has access" flag without roles.
3. Link-based sharing.

**Decision:** Option 1. Owner can rename, edit, share, revoke, delete. Editor can edit content and rename. Viewer is read-only.

**Why:** Roles cost little extra and cover a listed stretch item; a single `getAccess(userId, docId)` function centralizes the rules.

**Consequences:** Sharing is by email of an existing user only (no invites to unknown emails).

---

## D-006: File upload imports into a new document

- **Date:** 2026-10-29
- **Status:** Accepted

**Context:** Need one product-relevant upload flow.

**Options considered:**
1. Import .txt/.md/.docx into a new editable document.
2. Attachments stored alongside a document (needs blob storage on Vercel).
3. Import into an existing draft.

**Decision:** Option 1. Max 2 MB. `.txt` → paragraphs, `.md` → `marked`, `.docx` → `mammoth`.

**Why:** Directly feeds the core editing flow; no blob storage needed.

**Consequences:** Unsupported formatting (images, tables) is dropped during import; stated in UI and README.

---

## D-007: Tailwind CSS for styling

- **Date:** 2026-10-29
- **Status:** Accepted

**Context:** Need a clean, consistent UI across dashboard, editor toolbar and dialogs without spending the timebox on CSS.

**Options considered:**
1. Tailwind CSS: create-next-app default, utility classes, no extra files.
2. CSS Modules: zero dependencies, but more hand-written CSS per component.
3. Component library (shadcn/ui, MUI): fast widgets, but more setup and weight.

**Decision:** Tailwind CSS (v4, as scaffolded by create-next-app).

**Why:** Fastest path to a tidy UI; styles stay next to markup.

**Consequences:** Editor content styling (headings, lists inside Tiptap) needs a small amount of custom CSS or `@tailwindcss/typography` in session 2.

---

## D-008: Next 16 with Cache Components turned off

- **Date:** 2026-10-29
- **Status:** Accepted

**Context:** `create-next-app@16.4` enables `cacheComponents` (and `partialPrefetching`) by default. With it, every `cookies()` read must sit inside a `<Suspense>` boundary, and a top-level session check in a layout is discouraged.

**Options considered:**
1. Keep Cache Components: push session reads into Suspense boundaries; redirects happen mid-stream.
2. Turn it off: classic dynamic rendering; a plain session check in the `(app)` layout.

**Decision:** Option 2 (`cacheComponents: false` in `next.config.ts`; `partialPrefetching` removed since it requires it).

**Why:** Every page is per-user and dynamic, so the static shell gains nothing; option 2 keeps auth and the editor pages simple.

**Consequences:** Next says both become always-on in the next major; upgrading would need the Suspense pattern from `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`.

---

## D-009: Debounced, serialized whole-document autosave

- **Date:** 2026-10-29
- **Status:** Accepted

**Context:** Edits must persist without a save button, and responses can arrive out of order.

**Options considered:**
1. Debounced (800 ms) `PATCH` with the full Tiptap JSON; one request in flight, later edits merged and sent after it.
2. Send ProseMirror steps / CRDT (Yjs): enables real-time co-editing, much more infrastructure.
3. Optimistic concurrency (`updatedAt` version check, 409 on conflict).

**Decision:** Option 1 (`src/components/use-autosave.ts`).

**Why:** Simple and robust for single-writer editing; serializing saves means an older save can never overwrite a newer one from the same tab.

**Consequences:** Two people editing the same doc at once: last write wins (no real-time; deprioritized). Failed saves are kept and retried with the next edit or a Retry button; `beforeunload` warns about unsaved changes; leaving the editor in-app flushes and then calls `router.refresh()` so Back never reopens a stale cached copy. Option 3 is the cheap upgrade if conflicts matter later.

---

## D-010: Document lists rendered by server components, no list API yet

- **Date:** 2026-10-29
- **Status:** Accepted

**Context:** `ARCHITECTURE.md` planned `GET /api/documents`, but the dashboard is a server component.

**Options considered:**
1. Dashboard calls `listOwnedDocuments()` directly; list API added only when a client needs it.
2. Build the API now and fetch it from the client.

**Decision:** Option 1.

**Why:** Less code and no loading state; access rules stay in `src/server/`.

**Consequences:** After client mutations the dashboard is updated with `router.refresh()`. Session 3's "Shared with me" list can follow the same pattern.

---

## D-011: `getAccess()` built in session 2

- **Date:** 2026-10-29
- **Status:** Accepted

**Context:** Session 2's document endpoints need a role check; `getAccess()` was planned for session 3.

**Options considered:**
1. Full `getAccess()` (owner/editor/viewer via `document_shares`) now.
2. Owner-only checks now, rewire in session 3.

**Decision:** Option 1 (`src/server/access.ts`), chosen by the user.

**Why:** About 20 lines; avoids rewiring routes later.

**Consequences:** Session 3 only adds the shares API/UI and viewer UI. `requireAccess()` returns 404 for no access and 403 for an insufficient role on a visible doc.

---

## D-012: HTML → Tiptap JSON on the server with `@tiptap/html/server`

- **Date:** 2026-10-29
- **Status:** Accepted

**Context:** Markdown and .docx imports produce HTML that must become Tiptap JSON on the server, limited to what the editor supports.

**Options considered:**
1. `generateJSON` from `@tiptap/html/server` (needs `happy-dom`) with the shared `editorExtensions`.
2. ProseMirror `DOMParser` + `linkedom`, wired up by hand.

**Decision:** Option 1 (`src/server/import.ts`).

**Why:** Official Tiptap path; the editor's own schema decides what survives, so imports can never contain nodes the editor can't render.

**Consequences:** `happy-dom` is a server dependency (Turbopack bundles it fine). Unsupported content is dropped: images, links (off in the schema), scripts; tables become plain paragraphs.

---

## D-013: Document body limit raised to 4 MB

- **Date:** 2026-10-29
- **Status:** Accepted

**Context:** A 2 MB import can produce well over 1 MB of Tiptap JSON, so with the old 1 MB PATCH cap the imported doc could never autosave.

**Options considered:**
1. Raise the limit for PATCH and check imports against the same limit.
2. Keep 1 MB and reject imports whose JSON is over it.

**Decision:** Option 1, chosen by the user. 4 MB, one constant `MAX_DOCUMENT_BYTES` (`src/lib/validation.ts`).

**Why:** Normal 2 MB files fit; 4 MB stays under Vercel's 4.5 MB request body cap (5 MB would fail there).

**Consequences:** Pathological files (e.g. 2 MB of one-character lines) are rejected with 413. Documents near the cap are slow to render in the editor.

---
