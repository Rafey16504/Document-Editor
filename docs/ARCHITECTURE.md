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
| Editor | Tiptap (StarterKit + Underline), JSON storage | D-002 |
| DB | Drizzle ORM + libSQL (SQLite file locally, Turso in prod) | D-003 |
| Hosting | Vercel | D-003 |
| Auth | Seeded users, signed cookie session (mocked) | D-004 |
| Styling | Tailwind CSS 4 | D-007 |
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

## Access rules _(planned)_

Single source of truth: `getAccess(userId, documentId)` in `src/server/access.ts` returns `owner | editor | viewer | null`.

| Action | Owner | Editor | Viewer |
|--------|:-----:|:------:|:------:|
| Read | ✓ | ✓ | ✓ |
| Edit content / rename | ✓ | ✓ | |
| Share / revoke / delete | ✓ | | |

No access → 404 (does not leak existence).

## Request flow _(planned)_

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

Editor autosaves: debounced (~800 ms) `PATCH /api/documents/:id` with title/content; UI shows Saving / Saved / Error.

## API

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/session` | Log in as a seeded user `{ userId }` → `{ user }` (404 if unknown) |
| DELETE | `/api/session` | Log out (204) |
| GET | `/api/documents` | List `{ owned, shared }` _(planned)_ |
| POST | `/api/documents` | Create blank document _(planned)_ |
| GET | `/api/documents/:id` | Fetch document + caller's role _(planned)_ |
| PATCH | `/api/documents/:id` | Update title/content (owner/editor) _(planned)_ |
| DELETE | `/api/documents/:id` | Delete (owner) _(planned)_ |
| POST | `/api/documents/import` | Upload file → new document _(planned)_ |
| GET/POST/DELETE | `/api/documents/:id/shares` | List / grant / revoke access (owner) _(planned)_ |

## File import _(planned)_

`.txt` → paragraphs; `.md` → `marked` → HTML; `.docx` → `mammoth` → HTML. HTML is converted to Tiptap JSON with the same extension list as the editor, so unsupported nodes (images, tables) are dropped. Max 2 MB.

## Prioritized / deprioritized

- **Prioritized:** solid editing + autosave, server-enforced sharing with roles, file import, persistence, tests on access rules.
- **Deprioritized:** real-time co-editing, comments, version history, real authentication, attachments.

## Deployment _(planned)_

Vercel (GitHub import) + Turso DB. Set the env vars above in Vercel; run `db:push` and `db:seed` once against the Turso URL.
