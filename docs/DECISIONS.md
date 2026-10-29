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
