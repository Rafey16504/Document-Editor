# Architecture Note

A short note on what was built, what was prioritized and why. The full reference (data model, API, access rules, request flow) is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); every non-trivial choice has an entry in [docs/DECISIONS.md](docs/DECISIONS.md).

## Shape of the system

One Next.js 16 app (App Router, TypeScript strict) holds the UI and the API, deployed on Vercel. The data lives in SQLite through libSQL: a local file in development and Turso in production, with the same driver and schema in both (D-001, D-003).

```
Browser: React + Tiptap editor
   │  fetch /api/...            (pages are server components that read the DB directly)
   ▼
Route handlers (src/app/api)     parse + Zod-validate, read the signed session cookie
   ▼
Server modules (src/server)      getAccess() / requireAccess(), documents, shares, import, export
   ▼
Drizzle ORM → libSQL             users, documents (content as Tiptap JSON), document_shares
```

- **Documents** are stored as Tiptap/ProseMirror JSON (D-002). The JSON round-trips exactly, so formatting survives a reload, and it's validated against the same extension list the editor uses.
- **Access** has one source of truth: `getAccess(user, doc)` returns `owner | editor | viewer | null`, and every route goes through `requireAccess()`. If you can't see a document you get a 404, so its existence isn't leaked. If you can see it but your role doesn't allow the action, you get a 403 (D-005, D-011).
- **Autosave** is debounced (800 ms) and serialized: one request is in flight at a time, and edits made meanwhile are merged into the next request, so an older save can never overwrite a newer one. The status is visible, with a Retry button on failure (D-009).
- **Import** converts `.txt`, `.md` and `.docx` (≤ 2 MB) into a new document. Markdown and `.docx` become HTML, which then goes through the editor's own schema on the server, so imports can only contain nodes the editor supports (D-006, D-012).
- **Export** (the stretch goal) downloads any readable document as Markdown. It uses a small serializer written for our schema. Underline becomes `<u>`, which the importer reads back, so export → import round-trips (D-015).
- **Auth** is mocked on purpose: you pick a seeded user, and the session is an HMAC-signed, HTTP-only cookie (D-004). The access rules themselves are real and enforced on the server.

## What I prioritized, and why

1. **An editing loop that works.** Create → format → autosave → reload gives the same document. The brief puts the editing experience first, and a doc editor that loses work fails every other criterion. Most of the hardening went here: no stale cache on Back, a save on leaving the page, a warning on unsaved changes.
2. **Sharing enforced on the server.** Roles live in one module, which has the most unit tests (access matrix, 404 vs 403, cascades). Hiding buttons in the UI is a convenience only, not the security boundary.
3. **File handling that makes sense for a product.** Importing into a new editable document is the most useful upload for a document editor. The limits are stated in the UI and the README, and they're enforced on both client and server.
4. **A reviewer can run it with no setup and no cost.** No DB to install locally, free tiers in production, seeded users, and one command each for unit and e2e tests.

## What I deliberately left out

| Cut                                           | Why                                                                                                                                |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Real-time co-editing / presence               | Needs CRDTs (Yjs) and a websocket server; that's too much for the timebox to do well. Concurrent edits are last-write-wins (D-009) |
| Real authentication                           | Not what's being evaluated; seeded users show the sharing flows                                                                    |
| Comments, version history                     | Each is a feature in its own right; I only had room for one stretch item and picked export                                         |
| Attachments, images, links, tables in imports | They need storage and more editor schema; imports drop them, and the UI says so                                                    |
| Live access updates                           | A user whose access is revoked finds out on their next save ("Save failed")                                                        |

## Quality

- 53 Vitest unit tests on an in-memory DB: access rules, sharing, import conversion, export, validation, session tokens.
- 1 Playwright smoke suite (4 tests) against a production build with its own DB: login → create → format → reload → export → share → second user edits, plus import and error states (D-014).
- Errors are consistent: server code throws `AppError(status, message)`, and every route returns `{ error }` with that status. Unknown errors are logged and returned as a generic 500.
