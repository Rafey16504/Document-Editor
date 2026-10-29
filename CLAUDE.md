# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Ajaia assessment: lightweight collaborative document editor (Next.js + Tiptap + Drizzle/libSQL, deployed on Vercel + Turso). See `docs/ARCHITECTURE.md`.

## Sessions

Work is split into one chat per session; see `docs/SESSION_PLAN.md`. Stay within the current session's scope and hand off through the living docs.

## Git

The user handles all git write operations. A `PreToolUse` hook (`.claude/hooks/git-guard.js`) blocks write-capable git commands; read-only ones (status, log, diff, ...) are allowed.

## Feature workflow

Every feature goes through these four steps, in order. Don't skip ahead. Finish each step and confirm it with the user before starting the next.

1. **Analyze**: Understand the requirement. Clarify scope, inputs and outputs, edge cases and constraints. Look at the existing code it touches. Ask questions if anything is unclear.
2. **Design**: Propose the approach: components or files affected, data flow, APIs or schema changes, and the trade-offs. If the design involves a meaningful choice, record it in `DECISIONS.md`.
3. **Develop**: Implement the agreed design following `CODING_PRACTICES.md`. Keep changes focused on the feature.
4. **Test**: Verify the feature works. Write or update tests, run the test suite and check edge cases. Report results honestly, including failures.

After the Test step, log the work in `WORK_LOG.md`.

## Living docs

This project keeps four running documents in `docs/`. Read them at the start of a session and keep them current as work happens.

| File | Purpose | When to update |
|------|---------|----------------|
| [docs/CODING_PRACTICES.md](docs/CODING_PRACTICES.md) | Conventions and rules code must follow | When a convention is agreed on or changed |
| [docs/WORK_LOG.md](docs/WORK_LOG.md) | Chronological record of what was done each session | At the end of every session that changes code or plans |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Important technical/product decisions and their reasoning | Whenever a non-trivial choice is made (library, architecture, trade-off, reversal) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System overview, data model, API, access rules, local run steps | When a feature lands or the design/run steps change; drop `(planned)` once built |

### Rules

1. **Before starting work:** read `CODING_PRACTICES.md` and skim the latest entries in `WORK_LOG.md` and `DECISIONS.md`.
2. **Follow `CODING_PRACTICES.md`.** If a request conflicts with it, point out the conflict before proceeding.
3. **Log the session:** before finishing a session that changed anything, add an entry to the top of `WORK_LOG.md` using its template.
4. **Record decisions:** when a meaningful decision is made, add an entry to `DECISIONS.md` using its template, with the next sequential ID. Never delete past decisions; mark them `Superseded by D-XXX` instead.
5. **Keep it short:** entries should be brief and factual. Link to files (`path/to/file.ts:42`) rather than pasting code.
6. Use absolute dates (YYYY-MM-DD), never "today" or "last week".

## Commands

<!-- Fill in once the project is set up. -->
- Install: `npm install`, then `cp .env.example .env.local`
- DB: `npm run db:push` (apply schema), `npm run db:seed` (demo users, safe to re-run)
- Dev: `npm run dev`
- Typecheck: `npx next typegen && npx tsc --noEmit` (typegen creates the global `LayoutProps`/`PageProps` types)
- Lint / format: `npm run lint`, `npm run format`
- Build: `npm run build`
- Test: _TBD (session 5)_
