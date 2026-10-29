# Assessment Brief: Full Stack Product Engineer (Ajaia)

Copy of the assignment as given (lightly condensed formatting). Timebox: 4–6 hours; submit what you have at the limit.

## Scenario
Build a lightweight collaborative document editor inspired by Google Docs. Not a full recreation: ship the strongest working version within the timebox, showing product judgment, full stack capability and clear prioritization (document creation, editing, file handling, sharing, usability).

## Tasks

### 1. Document creation and editing
- Create a new document, rename a document, edit content in the browser, save and reopen documents.
- Rich text: bold, italic, underline, headings or text size variation, bulleted or numbered lists.
- Editing flow should feel usable and coherent.

### 2. File upload
- Upload at least one file into the product workflow, in a product-relevant way, e.g. .txt/.md/.docx → new editable document; attachment on a document; import into an existing draft.
- If file types are limited, state that clearly in the UI and README.

### 3. Sharing
- A document owner; a way to grant another user access; a visible distinction between owned and shared documents.
- Users may be simulated (seeded accounts, mocked auth, lightweight login).

### 4. Persistence
- Documents remain after refresh; formatting/structure preserved reasonably; shared access demonstrable.
- Any practical storage (SQLite, Postgres, Supabase, local file store if documented).

### 5. Product and engineering quality
- Clear setup and run instructions
- A working deployment reviewers can access
- Basic validation and error handling
- At least one meaningful automated test
- A short architecture note on what was prioritized and why

## AI-native workflow note
Short note covering: which AI tools were used; where AI materially sped up work; what AI output was changed or rejected; how correctness, UX quality and reliability were verified. (Practical usage, not volume.)

## Walkthrough video (3–5 min, unlisted Loom/YouTube)
Main user flow; what works end to end; what was intentionally deprioritized; key implementation decisions; how AI supported the workflow.

## Deliverables (one Google Drive folder)
- Source code
- README.md with local setup and run instructions
- Short architecture note (Markdown or PDF)
- AI workflow note (Markdown or PDF)
- SUBMISSION.md listing exactly what is included
- Live product URL
- Text file with the walkthrough video URL
- Screenshots or short demo GIF if setup requires extra steps

## Submission format
- One Google Drive folder link with all materials
- Live deployment link
- Credentials / seeded users / test accounts for sharing flows
- Clear local run instructions
- If partial: what works, what is incomplete, what you'd build next with another 2–4 hours

## Constraints
- Keep scope intentional; don't build every Google Docs feature; depth over breadth.
- Any language/framework/editor/tooling; AI tools allowed.
- Reviewers must not have to pay for any dependency or service.
- Product judgment is evaluated as much as implementation; make and explain deliberate scope cuts.

## Evaluation criteria
- Turning an open-ended prompt into a coherent product slice
- Full stack execution: frontend, backend, persistence, access logic
- Quality of the editing experience within scope
- Practical file upload and sharing behavior
- Infrastructure/deployment judgment; a testable build
- Code clarity, maintainability, delivery discipline
- Prioritization and trade-off awareness
- Written and verbal communication
- Mature AI use without sacrificing engineering standards

## Optional stretch (only one, only if early)
Real-time collaboration indicators; commenting or suggestion mode; version history; export to PDF or Markdown; role-based sharing beyond basic access.
