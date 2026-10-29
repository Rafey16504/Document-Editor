# Architecture

Living document: updated as features land. Sections marked _(planned)_ describe the agreed design and are not built yet.

_Last updated: 2026-10-29_

## Overview

A lightweight collaborative document editor (Google Docs-inspired) built as a single Next.js app. Users create, rename, edit and reopen rich-text documents, import `.txt` / `.md` / `.docx` files as new documents, and share documents with other users as **viewer** or **editor**.

## Run locally

Prerequisites: Node 20+ and npm. No database install needed (uses a local SQLite file).

```bash
npm install
cp .env.example .env.local     # defaults work for local dev
npm run db:push                # create tables in ./local.db
npm run db:seed                # create demo users
npm run dev                    # http://localhost:3000
```

Tests _(planned, session 5)_:

```bash
npm test                       # unit tests (Vitest)
npm run test:e2e               # Playwright smoke test
```

Seeded demo users (pick one on the login page): `alice@ajaia.dev`, `bob@ajaia.dev`, `carol@ajaia.dev`.

### Environment variables

| Var | Local default | Production |
|-----|---------------|------------|
| `DATABASE_URL` | `file:local.db` | Turso `libsql://...` URL |
| `DATABASE_AUTH_TOKEN` | _(empty)_ | Turso token |
| `SESSION_SECRET` | any long string | random 32+ char secret |

## Stack

| Layer | Choice | Decision |
|-------|--------|----------|
| App / API | Next.js 16 App Router (Cache Components off), TypeScript strict | D-001, D-008 |
| Editor | Tiptap 3 (StarterKit, which includes Underline), JSON storage | D-002 |
| DB | Drizzle ORM + libSQL (SQLite file locally, Turso in prod) | D-003 |
| Hosting | Vercel | D-003 |
| Auth | Seeded users, signed cookie session (mocked) | D-004 |
| Styling | Tailwind CSS 4 + `@tailwindcss/typography` for document content | D-007 |
| Validation | Zod | — |
| Tests | Vitest, Playwright | — |

## Data model

Defined in `src/server/db/schema.ts`; ids are UUID text, timestamps are integer milliseconds, foreign keys cascade on delete.

```
users            (id, email UNIQUE, name)
documents        (id, owner_id → users, title, content JSON, created_at, updated_at)
document_shares  (document_id → documents, user_id → users, role 'viewer'|'editor', created_at,
                  PK(document_id, user_id), INDEX(user_id))
```

## Auth / session

Mocked auth (D-004), in `src/server/session.ts`:

- Cookie `session` = `<userId>.<expiresAtMs>.<HMAC-SHA256 signature>` (Web Crypto, keyed by `SESSION_SECRET`, which must be 32+ chars). HTTP-only, `SameSite=Lax`, `Secure` in production, 7-day expiry.
- `getCurrentUser()` returns `null` for a missing, tampered, expired or unknown-user cookie; it is cached per request.
- Pages: the `src/app/(app)/layout.tsx` group redirects to `/login` when logged out. API routes call `requireUser()` (401).
- Route handlers are wrapped in `handle()` (`src/server/route.ts`): `AppError` → its status, `ZodError` → 400, anything else → logged 500, always `{ error }`.

## Access rules

Single source of truth: `getAccess(userId, documentId)` in `src/server/access.ts` returns `owner | editor | viewer | null`. `requireAccess(userId, documentId, allowed)` throws 404 when the user has no access and 403 when they can see the document but their role is not allowed (D-011). Shares are already read; granting them arrives in session 3.

| Action | Owner | Editor | Viewer |
|--------|:-----:|:------:|:------:|
| Read | ✓ | ✓ | ✓ |
| Edit content / rename | ✓ | ✓ | |
| Share / revoke / delete | ✓ | | |

No access → 404 (does not leak existence).

## Request flow

```
Browser (React + Tiptap)
  │  fetch /api/...
  ▼
Route handler (src/app/api/**/route.ts)   parse + Zod validate, read session
  ▼
Server modules (src/server/*)             access checks, business logic, import conversion
  ▼
Drizzle → libSQL (local.db | Turso)
```

Pages are server components that call `src/server/*` directly (dashboard, editor page); client components call the API for mutations and then `router.refresh()` (D-010).

## Editor

- Extensions: `src/lib/editor-extensions.ts` (StarterKit, headings 1–3, links off). Shared with the planned import so stored JSON only contains supported nodes.
- `src/components/document-editor.tsx`: title input + Tiptap (`immediatelyRender: false`); toolbar in `editor-toolbar.tsx` (B/I/U, H1–H3, lists, undo/redo; buttons don't take focus). Takes the caller's `role`; viewers get no toolbar and a read-only editor.
- Autosave (`use-autosave.ts`, D-009): changes merge into one pending patch, debounced 800 ms, one request in flight at a time. Status: Unsaved changes / Saving… / All changes saved / Save failed + Retry. `beforeunload` warns on unsaved changes; leaving the editor in-app flushes, then refreshes the router cache.
- An empty title is stored as "Untitled document"; titles max 200 chars; PATCH bodies max 1 MB (413).

## API

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/session` | Log in as a seeded user `{ userId }` → `{ user }` (404 if unknown) |
| DELETE | `/api/session` | Log out (204) |
| GET | `/api/documents` | List `{ owned, shared }` _(deferred, D-010: pages list server-side)_ |
| POST | `/api/documents` | Create blank document → `201 { document }` |
| GET | `/api/documents/:id` | Fetch `{ document, role }` (any access) |
| PATCH | `/api/documents/:id` | Update `{ title?, content? }` (owner/editor) → `{ document }` summary |
| DELETE | `/api/documents/:id` | Delete (owner) → 204 |
| POST | `/api/documents/import` | Upload file → new document _(planned)_ |
| GET/POST/DELETE | `/api/documents/:id/shares` | List / grant / revoke access (owner) _(planned)_ |

## File import _(planned)_

`.txt` → paragraphs; `.md` → `marked` → HTML; `.docx` → `mammoth` → HTML. HTML is converted to Tiptap JSON with the same extension list as the editor, so unsupported nodes (images, tables) are dropped. Max 2 MB.

## Prioritized / deprioritized

- **Prioritized:** solid editing + autosave, server-enforced sharing with roles, file import, persistence, tests on access rules.
- **Deprioritized:** real-time co-editing, comments, version history, real authentication, attachments.

## Deployment _(planned)_

Vercel (GitHub import) + Turso DB. Set the env vars above in Vercel; run `db:push` and `db:seed` once against the Turso URL.
