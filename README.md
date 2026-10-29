# Ajaia Docs

A lightweight collaborative document editor inspired by Google Docs. Create, rename, format and reopen rich-text documents, import `.txt` / `.md` / `.docx` files as new documents, and share documents with other users as **viewer** or **editor**.

Built with Next.js 16 (App Router), Tiptap 3, Drizzle ORM and libSQL (SQLite locally, Turso in production), deployed on Vercel.

**Live demo:** _coming soon_

## Features

- **Documents:** create, rename inline, edit, delete (owner only). Autosave (debounced, with a visible status and retry on failure); content is stored as Tiptap JSON so formatting survives a reload.
- **Formatting:** bold, italic, underline, headings 1–3, bulleted and numbered lists, undo / redo.
- **File import:** upload a file to create a new editable document.
  - Supported types: **`.txt`, `.md`, `.docx`** only, up to **2 MB**.
  - Images, links and tables are not kept (tables flatten to text); the document title is the file name.
- **Sharing:** the owner grants access by email as viewer or editor, can change the role or revoke it. The dashboard separates **My documents** from **Shared with me**, with role badges. Viewers get a read-only editor.
- **Access control** is enforced on the server for every request. Users without access get a 404, so a document's existence isn't leaked.

## Demo users

Auth is mocked: there are no passwords. Pick a seeded user on the login page.

| User | Email |
|------|-------|
| Alice | `alice@ajaia.dev` |
| Bob | `bob@ajaia.dev` |
| Carol | `carol@ajaia.dev` |

To try sharing: log in as Alice, create a document, click **Share** and add `bob@ajaia.dev`. Log out, log in as Bob, and find it under **Shared with me**.

## Run locally

Prerequisites: Node.js 20+ and npm. No database install is needed: it uses a local SQLite file.

```bash
npm install
cp .env.example .env.local     # defaults work for local development
npm run db:push                # create tables in ./local.db
npm run db:seed                # create the demo users (safe to re-run)
npm run dev                    # http://localhost:3000
```

### Environment variables

| Variable | Local default | Production |
|----------|---------------|------------|
| `DATABASE_URL` | `file:local.db` | Turso `libsql://...` URL |
| `DATABASE_AUTH_TOKEN` | _(empty)_ | Turso auth token |
| `SESSION_SECRET` | any 32+ character string | random 32+ character secret |

## Tests

```bash
npm test                       # unit tests (Vitest, in-memory DB, no setup needed)
npx playwright install chromium   # first time only
npm run test:e2e               # end-to-end smoke test (Playwright)
```

- **Unit tests** (`tests/*.test.ts`): access rules and role enforcement, sharing, file import conversion, input validation and session tokens.
- **E2E test** (`tests/e2e/smoke.spec.ts`): builds the app and runs it on port 3210 against a separate `e2e.db`, so your local data is untouched. Covers login → create → format → rename → share → second user opens and edits, Markdown import, import errors, empty and not-found states, and the logged-out redirect.

## Other commands

| Command | Purpose |
|---------|---------|
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npx next typegen && npx tsc --noEmit` | Typecheck |

## Project structure

```
src/
  app/            pages (login, dashboard, editor) and API routes under app/api
  components/     client components: editor, toolbar, share dialog, import button
  lib/            code shared by client and server (editor extensions, validation, import rules)
  server/         server-only logic: session, access rules, documents, shares, import, db
tests/            Vitest unit tests, fixtures and Playwright e2e
docs/             architecture, decisions, coding practices, work log
```

## Scope

**Prioritized:** a solid editing experience with reliable autosave, server-enforced sharing with roles, file import, persistence, and tests on the access rules.

**Deliberately left out:** real-time co-editing, comments, version history, real authentication and attachments. Access changes are not pushed live: a user whose access is revoked sees "Save failed" on their next save.

## Documentation

- [Architecture](docs/ARCHITECTURE.md): data model, API, access rules, request flow
- [Decisions](docs/DECISIONS.md): technical and product decisions with their reasoning
- [Coding practices](docs/CODING_PRACTICES.md)
- [Work log](docs/WORK_LOG.md)
