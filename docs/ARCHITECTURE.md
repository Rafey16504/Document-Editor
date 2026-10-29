# Architecture

Living document: updated as features land. Sections marked _(planned)_ describe the agreed design and are not built yet.

_Last updated: 2026-10-29_

## Overview

A lightweight collaborative document editor (Google Docs-inspired) built as a single Next.js app. Users create, rename, edit and reopen rich-text documents, import `.txt` / `.md` / `.docx` files as new documents, and share documents with other users as **viewer** or **editor**.

## Run locally _(planned: commands are final once the scaffold lands)_

Prerequisites: Node 20+ and npm. No database install needed (uses a local SQLite file).

```bash
npm install
cp .env.example .env.local     # defaults work for local dev
npm run db:push                # create tables in ./local.db
npm run db:seed                # create demo users
npm run dev                    # http://localhost:3000
```

Tests:

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
| App / API | Next.js App Router, TypeScript strict | D-001 |
| Editor | Tiptap (StarterKit + Underline), JSON storage | D-002 |
| DB | Drizzle ORM + libSQL (SQLite file locally, Turso in prod) | D-003 |
| Hosting | Vercel | D-003 |
| Auth | Seeded users, signed cookie session (mocked) | D-004 |
| Validation | Zod | — |
| Tests | Vitest, Playwright | — |

## Data model _(planned)_

```
users            (id, email UNIQUE, name)
documents        (id, owner_id → users, title, content JSON, created_at, updated_at)
document_shares  (document_id → documents, user_id → users, role 'viewer'|'editor', PK(document_id, user_id))
```

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

## API _(planned)_

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/session` | Log in as a seeded user |
| DELETE | `/api/session` | Log out |
| GET | `/api/documents` | List `{ owned, shared }` |
| POST | `/api/documents` | Create blank document |
| GET | `/api/documents/:id` | Fetch document + caller's role |
| PATCH | `/api/documents/:id` | Update title/content (owner/editor) |
| DELETE | `/api/documents/:id` | Delete (owner) |
| POST | `/api/documents/import` | Upload file → new document |
| GET/POST/DELETE | `/api/documents/:id/shares` | List / grant / revoke access (owner) |

## File import _(planned)_

`.txt` → paragraphs; `.md` → `marked` → HTML; `.docx` → `mammoth` → HTML. HTML is converted to Tiptap JSON with the same extension list as the editor, so unsupported nodes (images, tables) are dropped. Max 2 MB.

## Prioritized / deprioritized

- **Prioritized:** solid editing + autosave, server-enforced sharing with roles, file import, persistence, tests on access rules.
- **Deprioritized:** real-time co-editing, comments, version history, real authentication, attachments.

## Deployment _(planned)_

Vercel (GitHub import) + Turso DB. Set the env vars above in Vercel; run `db:push` and `db:seed` once against the Turso URL.
