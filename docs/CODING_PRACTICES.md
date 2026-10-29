# Coding Practices

Conventions for this codebase. Add or change rules as they are agreed on; note the date and the related decision (if any).

_Last updated: 2026-10-29_

## Language & tooling
- TypeScript `strict`, Node 20+, npm. (D-001)
- ESLint (Next config) + Prettier defaults.

## Project structure
- `src/app/` — pages and route handlers (`app/api/**/route.ts`). Thin: parse input, call server code, map errors.
- `src/server/` — business logic, DB access, auth, import conversion. No React imports here.
- `src/components/` — client UI components.
- `src/lib/` — code shared by client and server (types, Zod schemas, editor extension list).
- Tests in `tests/` (unit: `*.test.ts`, e2e: `tests/e2e/*.spec.ts`).

## Naming
- Files: `kebab-case.ts`; React components `PascalCase` exports.
- DB tables/columns: `snake_case`; TS fields `camelCase` (Drizzle maps).
- Env vars: `UPPER_SNAKE_CASE`, documented in `.env.example`.

## Code style
- Small functions; avoid premature abstraction.
- Comments explain *why*, not *what*.
- `async/await` only; no floating promises.

## Error handling & logging
- Validate every request body with Zod (`src/lib/validation.ts`).
- Server code throws `AppError(status, message)`; route handlers convert it to JSON `{ error }` with that status. Unknown errors → 500 with a generic message, logged with `console.error`.
- Access checks always happen on the server via `getAccess()`; the UI only hides controls.
- Pages get the user with `requirePageUser()`, never `getCurrentUser()!`: layouts don't guard pages in Next 16. (Added 2026-10-29)
- Return 404 (not 403) for documents the user cannot see, to avoid leaking existence.

## Testing
- Unit test access rules and import conversion (Vitest, in-memory libSQL). Tests create their own users/docs via `tests/helpers.ts`; never depend on seeded data. (D-014)
- One Playwright smoke test for the main flow, against its own `e2e.db`. Prefer role/label locators; Next's route announcer also has `role="alert"`, so match error messages by text.
- `npm test` must pass before a step is reported done; run `npm run test:e2e` when UI flows change.

## Git & commits
- User handles git; no commits from the assistant (enforced by `.claude/hooks/git-guard.js`).
- One branch per session (`session-<n>-<topic>`, see `docs/SESSION_PLAN.md`), branched from `main` and merged back before the next session. At the end of each session the assistant provides the exact commands for that session's branch.

## Security & secrets
- No secrets in code; `.env.local` is gitignored, `.env.example` lists keys.
- Session cookie: HTTP-only, `SameSite=Lax`, HMAC-signed.
- Never render user HTML directly; content goes through the Tiptap schema.

## Do / Don't
| Do | Don't |
|----|-------|
| Put rules in `src/server/access.ts` | Check permissions only in the UI |
| Keep route handlers thin | Put DB queries in components |
| State limits (file types/size) in UI + README | Silently drop failures |

---

### Rule template
```
- **<Rule>** — <short why>. (Added YYYY-MM-DD, see D-XXX)
```
