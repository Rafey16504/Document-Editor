# Video Talking Points (3–5 min)

An outline for the walkthrough, not a script. Times are rough targets. Before recording: open the live URL in one window and log in as Alice in a normal window and as Bob in a private one (cookies are per browser profile). Have a small `.md` or `.docx` file ready.

## 1. Intro (≈20 s)
- Ajaia Docs: a lightweight Google Docs–style editor. The focus was a solid editing loop, real server-side sharing, and file import, rather than many features.
- Stack in one line: Next.js + Tiptap + SQLite (Turso) on Vercel, all free tier.

## 2. Main flow (≈2 min)
- **Alice:** New document → rename it → type, then bold / italic / underline, H1/H2, bullet and numbered lists. Point out the autosave status ("Saving…" → "All changes saved").
- **Reload:** everything comes back with its formatting (content is stored as Tiptap JSON).
- **Import:** back to the dashboard → Import file → `.docx` or `.md` opens as an editable doc. Show the stated limits, then try a `.pdf` to show the clear error.
- **Share:** Share → `bob@ajaia.dev` as Viewer.
- **Bob's window:** "Shared with me" with the owner and a "Can view" badge → read-only editor, no toolbar.
- **Alice** changes Bob to Editor → Bob reloads and can edit → Alice reloads and sees Bob's change.
- **Export .md** (stretch): download it and show the Markdown file.

## 3. What was deprioritized (≈40 s)
- Real-time co-editing and presence: needs CRDTs and a websocket server. Concurrent edits are last-write-wins, chosen consciously.
- Real auth: mocked with seeded users, because the sharing *rules* are what matter here.
- Comments and version history; images/tables/links in imports (dropped, and the UI says so).
- I picked Markdown export as the one stretch goal: it's small, useful, and it round-trips with import.

## 4. Key implementation decisions (≈50 s)
- **Access in one place:** `getAccess()` returns owner/editor/viewer/none. Every API route goes through it. No access → 404 so a document's existence isn't leaked; wrong role → 403. The UI only hides controls.
- **Autosave design:** debounced and serialized, so an older save can never overwrite a newer one; visible status, Retry, and a warning on unsaved changes.
- **Import through the editor's schema:** Markdown/.docx → HTML → Tiptap JSON using the same extension list as the editor, so an import can't contain anything the editor can't render.
- **Testing:** 53 unit tests on an in-memory DB (mostly access rules), plus a Playwright smoke test of the full share flow against a production build.

## 5. How AI supported the work (≈40 s)
- Claude Code throughout, but structured: 7 scoped sessions, living docs as the hand-off, Analyze → Design → Develop → Test with my sign-off at each step, and a hook that blocks the agent from git writes.
- Fast for scaffolding, library wiring, tests and verification scripts.
- One or two concrete catches: the toolbar stealing focus (Space toggled Bold); the Next 16 auth-guard assumption that was wrong (pages render alongside layouts).
- Verification: tests had to pass before a step counted as done; a mutation check (breaking `getAccess` fails 15 tests); a production check after deploy.

## Close (≈10 s)
- Next with more time: real-time collaboration with Yjs, version history, real auth.
