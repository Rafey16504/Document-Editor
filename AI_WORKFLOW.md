# AI Workflow Note

## Tools

**Claude Code** (Anthropic's CLI agent, running Claude Opus) was the only AI tool. I used it inside the repo for planning, coding, testing, deployment help and docs. I made the product and scope decisions, reviewed the output, and did every git commit myself.

## How I set it up

The aim was to make AI output reviewable, not just fast:

- **Sessions.** I split the work into 7 focused chats (`docs/SESSION_PLAN.md`): scaffold/auth, editor, sharing, import, tests, deploy, deliverables. Each chat started with a clean context and only that session's scope.
- **Living docs as the hand-off.** `CODING_PRACTICES.md`, `ARCHITECTURE.md`, `DECISIONS.md` and `WORK_LOG.md` were read at the start of each session and updated at the end. The next session picked up from the docs, not from chat history, so the docs had to stay accurate.
- **A fixed feature workflow** in `CLAUDE.md`: Analyze → Design → Develop → Test. The AI had to stop for my confirmation after analysis and after design, so I approved every plan before any code was written.
- **Guardrails.** A `PreToolUse` hook (`.claude/hooks/git-guard.js`) blocks any git write command from the agent, so nothing reached the repo without my review. Secrets stay in `.env.local`, which is gitignored.

## Where AI materially sped things up

- **Scaffolding and wiring:** Next 16 + Drizzle + libSQL + Tailwind, the signed-cookie session, and the route error helper took minutes instead of hours.
- **Library integration:** Tiptap 3's JSON model, `@tiptap/html/server` for converting imported HTML through the editor schema, `mammoth` for `.docx`, `marked` for Markdown.
- **Tests:** 53 unit tests and the Playwright smoke suite, including fixtures (`.docx` files generated with jszip) and an isolated test DB setup (D-014).
- **Verification scripts:** every session ended with scripted API checks (curl) and Playwright click-throughs, beyond the committed tests. Examples: 36 checks on the shares API, 27 browser steps on sharing.
- **Docs:** decision records, the work log and these notes, written as the work happened rather than at the end.

## What was changed or rejected

AI output was often close, but testing caught real problems. All of these are recorded in `docs/WORK_LOG.md`:

- **Toolbar stole focus.** In the first toolbar, clicking a button moved focus to it, so pressing Space toggled Bold again. Fixed with `onMouseDown` preventDefault.
- **Stale page could overwrite newer content.** Going Back after editing showed Next's cached page, and its autosave would then save over the newer content. Fixed by refreshing the router after the final save.
- **Auth guard assumption was wrong for Next 16.** Pages assumed the layout's redirect protected them (`getCurrentUser()!`). Next renders layouts and pages at the same time, so logged-out visits threw on the server. Replaced with `requirePageUser()` in every page and added it as a coding rule.
- **Toolbar was blank until the first click** on shared documents: the editor-state hook started before the editor existed. I split the component so the toolbar mounts only once the editor is ready.
- **`.docx` underline was silently dropped** by mammoth's defaults. Caught by checking the imported output, and fixed with a style map.
- **Size limits.** Session 2's 1 MB save cap meant a 2 MB import could produce a document that never autosaves. The AI raised the conflict and offered two options; I chose one limit of 4 MB, under Vercel's 4.5 MB request cap (D-013).
- **Defaults I didn't take:** the latest Vitest (5), which needs `@types/node` 22+ while the project targets Node 20; Vercel's Turso marketplace integration, which sets `TURSO_*` env var names the app doesn't read; `@tiptap/markdown` for export, where a small serializer with its own tests was simpler (D-015).
- **Export serializer:** the first version put trailing whitespace inside nested lists. The unit test caught it before it shipped.

## How correctness, UX and reliability were verified

- **Automated tests:** `npm test` (53 Vitest tests on an in-memory DB) and `npm run test:e2e` (Playwright against a production build with its own DB). Both had to pass before a step counted as done.
- **Mutation check:** I deliberately broke `getAccess()` to grant everyone owner access, and 15 tests failed. That shows the access tests actually protect the rules.
- **Manual and scripted checks per feature:** status codes for every role (401 / 403 / 404 / 413), autosave failure and retry, reload persistence, each import type plus bad, empty, corrupt and oversized files.
- **Static checks** on every change: `tsc --noEmit`, ESLint, Prettier, `next build`.
- **Production check after deploy:** the full sharing flow over the live API (viewer read-only, editor can edit but not delete, a stranger gets 404), plus imports.
- **UX:** I reviewed screenshots of each main screen (`docs/screenshots/`). The error messages are specific ("Unsupported file type. Use .txt, .md or .docx", "Save failed: Document not found").
