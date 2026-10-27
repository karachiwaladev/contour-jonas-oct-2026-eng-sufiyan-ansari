# Software Factory

This repo is a **software factory**: tickets arrive as GitHub issues (`Ticket #N`),
an agent loop picks them up, builds the work, and pushes it to `main`.
We build and improve the loop; the projects are its output.

## Progressive disclosure

This file is the **base index**. Keep it small and load detail only when needed:

1. Read this file first: what exists and where.
2. Open a project's own `README.md` only when a ticket touches that project.
3. Open source files only after the README tells you which ones matter.

Rules:
- **Keep this file under 100 lines at all times.** Detail belongs in the project folder, not here.
- One line per entry in the index below: path, plus a short purpose.

## Layout

- Each project lives in **its own top-level folder** with its own `README.md`.
- New project → create `<name>/`, add `<name>/README.md`, add one line to the index.
- Removed or renamed project → update the index in the same commit.

## Index

| Path | Purpose |
|------|---------|
| `.claude/skills/factory-loop/` | Skill: work open `Ticket #N` issues end to end |
| `.claude/settings.json` | Guardrails: `permissions.deny` plus PreToolUse hook `.claude/hooks/block-dangerous.js` (tests beside it) |
| `todo/` | Todo app (browser, IndexedDB): tasks, done, delete, status and tag filters, due dates, tags, recurring tasks, priority, edit |

## Working tickets

- Use the `factory-loop` skill: lowest-numbered open ticket first.
- Deliverable must match the ticket's wording; close it with a link to the evidence (commit SHA or URL).
- Push to `main`; only what is on GitHub counts.

## Ground rules

- Training repo only: no Jonas or Contour code, no real keys.
