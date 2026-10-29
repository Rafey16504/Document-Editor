# Session Plan

The project is split into focused chats to keep context small. Each chat does **one** session below, then stops.

## How each chat works

1. Start a fresh chat (`/clear`) and paste the session's kickoff prompt.
2. Claude reads `CLAUDE.md`, `docs/CODING_PRACTICES.md`, `docs/ARCHITECTURE.md`, and the top entry of `docs/WORK_LOG.md`. Those docs are the hand-off; no need to re-explain earlier chats.
3. Follow the feature workflow (Analyze → Design → Develop → Test), confirming each step.
4. Before ending: update `WORK_LOG.md` (with concrete next steps), `ARCHITECTURE.md` (drop `(planned)` on what was built), `DECISIONS.md` if needed, and tick the session below.
5. User commits (Claude does not run git writes).

Token tips: read only the files the session touches; don't re-read docs already loaded; keep the session to its scope and note extras as next steps.

## Sessions

| # | Status | Session | Scope | Done when |
|---|--------|---------|-------|-----------|
| 1 | ☐ | Scaffold, DB, auth | Next.js + TS app, Drizzle schema (users, documents, document_shares), libSQL client, seed script, `.env.example`, login page (pick seeded user), signed cookie session, `AppError` + route helper | `npm run dev` → log in as alice, logout works; `db:push` / `db:seed` work |
| 2 | ☐ | Documents + editor | Dashboard (owned list), create, `GET/PATCH/DELETE /api/documents/:id`, Tiptap editor with toolbar (B/I/U, H1–H3, lists, undo/redo), debounced autosave + status, inline rename | Create → format → refresh → formatting preserved |
| 3 | ☐ | Sharing | `getAccess()`, shares API (grant by email, role change, revoke), share dialog, "Shared with me" section + role badges, read-only editor for viewers | Alice shares with Bob as viewer/editor; Bob sees it and is limited correctly |
| 4 | ☐ | File import | `POST /api/documents/import` (.txt/.md/.docx, 2 MB), HTML → Tiptap JSON, upload UI stating supported types, error states | Each file type imports into an editable doc; bad type/size shows a clear error |
| 5 | ☐ | Tests + hardening | Vitest: access rules, import conversion, validation; Playwright smoke (login → create → edit → share → second user sees it); error/empty/loading states pass | `npm test` and `npm run test:e2e` green |
| 6 | ☐ | Deploy | Turso DB, Vercel project, env vars, push schema + seed to prod, verify live flow | Live URL works with the seeded users |
| 7 | ☐ | Deliverables (+ stretch) | README, architecture note, AI workflow note, `SUBMISSION.md`, video URL file, screenshots, video talking points; Markdown export if time allows | Everything on the brief's deliverables list exists |

## Kickoff prompts

Copy the prompt for the session you're starting:

- **1:** `Start session 1 from docs/SESSION_PLAN.md (scaffold, DB, auth).`
- **2:** `Start session 2 from docs/SESSION_PLAN.md (documents + editor).`
- **3:** `Start session 3 from docs/SESSION_PLAN.md (sharing).`
- **4:** `Start session 4 from docs/SESSION_PLAN.md (file import).`
- **5:** `Start session 5 from docs/SESSION_PLAN.md (tests + hardening).`
- **6:** `Start session 6 from docs/SESSION_PLAN.md (deploy). I have Turso + Vercel accounts ready.`
- **7:** `Start session 7 from docs/SESSION_PLAN.md (deliverables).`

The assessment brief is in `docs/BRIEF.md` (needed mainly for session 7).
