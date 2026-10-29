# Submission: Ajaia Docs

Full Stack Product Engineer assessment: a lightweight collaborative document editor.

- **Live product:** https://document-editor-ajaia.vercel.app
- **Source:** https://github.com/Rafey16504/Document-Editor
- **Google Drive:** https://drive.google.com/drive/folders/1Y61PMvy3DI1VDxbkkUZfBbNUbbuTkFJA?usp=sharing
- **Walkthrough video:** https://drive.google.com/file/d/17sLJhmuQYZx3YkN2DB9Y43Xtf14CDWGX/view?usp=sharing

## Test accounts

Auth is mocked. There are no passwords: pick a user on the login page.

| User  | Email             | Use it to                                         |
| ----- | ----------------- | ------------------------------------------------- |
| Alice | `alice@ajaia.dev` | Create documents and share them                   |
| Bob   | `bob@ajaia.dev`   | See documents shared with him ("Shared with me")  |
| Carol | `carol@ajaia.dev` | Check that a user without access gets "not found" |

**Sharing flow:** log in as Alice → New document → type and format something → **Share** → add `bob@ajaia.dev` as Viewer or Editor → Log out → log in as Bob → open it from **Shared with me**. A viewer gets a read-only editor; an editor can edit, and the changes reach Alice.

## What's included

| Item                                         | Where                                                                                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Source code                                  | `src/` (app), `tests/` (unit + e2e), config files at the root                                                                      |
| README with local setup and run instructions | [`README.md`](README.md)                                                                                                           |
| Architecture note                            | [`ARCHITECTURE_NOTE.md`](ARCHITECTURE_NOTE.md) (short); full reference in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)           |
| AI workflow note                             | [`AI_WORKFLOW.md`](AI_WORKFLOW.md)                                                                                                 |
| This list                                    | `SUBMISSION.md`                                                                                                                    |
| Live product URL                             | Above, and in `README.md`                                                                                                          |
| Walkthrough video URL                        | [`VIDEO_URL.txt`](VIDEO_URL.txt)                                                                                                   |
| Screenshots                                  | [`docs/screenshots/`](docs/screenshots): login, dashboard, editor, share dialog, import error, Bob's shared list, viewer read-only |
| Decision log                                 | [`docs/DECISIONS.md`](docs/DECISIONS.md): 15 technical and product decisions with reasoning                                        |
| Work log                                     | [`docs/WORK_LOG.md`](docs/WORK_LOG.md): what was done in each session, bugs found, verification                                    |
| Video talking points                         | [`docs/VIDEO_TALKING_POINTS.md`](docs/VIDEO_TALKING_POINTS.md)                                                                     |

## Run locally (short version)

Node 20+, no database install needed. Full steps are in `README.md`.

```bash
npm install
cp .env.example .env.local
npm run db:push && npm run db:seed
npm run dev                 # http://localhost:3000
npm test                    # unit tests
```

## What works end to end

- **Documents:** create, rename, edit, delete; autosave with a visible status and Retry; content and formatting survive a reload.
- **Formatting:** bold, italic, underline, headings 1–3, bulleted and numbered lists, undo/redo.
- **File upload:** import `.txt`, `.md` or `.docx` (max 2 MB) as a new editable document. The limits are stated in the UI and README, and bad files get clear errors.
- **Sharing:** the owner grants viewer/editor access by email, changes roles, revokes. "My documents" and "Shared with me" are separate on the dashboard, with role badges. All rules are enforced on the server.
- **Stretch: export to Markdown.** Any user who can read a document can download it as `.md`.
- **Tests:** 53 unit tests and a Playwright smoke suite (4 tests), all passing.

## Known limitations

- No real-time co-editing: two people editing the same document at the same time is last-write-wins.
- Access changes aren't pushed to open tabs. A user whose access was revoked sees "Save failed" on their next save.
- Imports drop images, links and tables (tables become plain text). Markdown export doesn't include the title.
- Auth is mocked (pick a seeded user).

## Next 2–4 hours

1. **Real-time collaboration:** Yjs + Tiptap collaboration extension over a websocket provider (e.g. Hocuspocus or Liveblocks), with presence cursors. This also replaces last-write-wins.
2. **Version history:** save a snapshot on each autosave burst; list and restore snapshots (owner/editor).
3. **Real auth:** email magic links (e.g. Auth.js) in place of the user picker, plus inviting emails that don't have an account yet.
4. **Editor depth:** links, images (object storage), tables, and keeping them on import.
5. **Live access updates:** poll or push role changes so a viewer/editor sees a revoke immediately.
