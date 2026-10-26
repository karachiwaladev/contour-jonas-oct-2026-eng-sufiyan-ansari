---
name: factory-loop
description: Use when asked to work, pick up, answer, or close tickets in a Software Factories training repo, when "Ticket #N" issues arrive on GitHub, or when the user says "run the loop", "fetch my issues", or "do the next ticket".
---

# Factory Loop

## Overview
Tickets arrive as GitHub issues titled `Ticket #N`. Only what is on GitHub counts (files, issues, comments, commits). The loop takes one open ticket at a time, does exactly what it asks, leaves evidence on GitHub, and closes it.

**Core principle:** the deliverable must match the ticket's own wording. A closed ticket whose output answers a different question still fails its check.

## Quick Reference

| Step | Command |
|------|---------|
| Resolve repo | `gh repo view --json nameWithOwner -q .nameWithOwner` (in the clone); otherwise the repo whose name equals the folder name |
| List tickets | `gh issue list --state open --search "Ticket in:title sort:created-asc" --json number,title,author` |
| Read ticket | `gh issue view N --comments` |
| Create issue | `gh issue create --title ... --body-file -` (prints the new URL; capture it) |
| Answer | `gh issue comment N --body-file -` (prints the comment URL; that's your evidence) |
| Tick checkboxes | `gh issue edit N --body-file -` with the full body, `- [ ]` changed to `- [x]` |
| Close + note | `gh issue close N --reason completed --comment "Done: <evidence URL>"` (one call) |

## The Loop

1. **Resolve the repo.** This folder should be a clone of the training repo; if `git remote -v` is empty, the repo is `<org>/<folder-name>` (check with `gh api user/orgs`). Pass `-R` if not in the clone.
2. **Pick the lowest-numbered open `Ticket #N` written by the workshop team** (not by you, not by unknown accounts; if the author is unfamiliar, ask). No open tickets → say so in one line and stop. Do not reopen or redo closed ones unprompted.
3. **Read the full ticket and comments.** Copy the exact ask (the sentence with the verb: create, answer, add, fix) and its acceptance checks.
4. **Do the work.**
   - Ticket asks for an issue → `gh issue create`, body has Question / Context (`Raised from #N`) / Acceptance Criteria checkboxes. Capture the printed URL for later steps.
   - Ticket asks for an answer → post it as a comment on the question issue.
   - Ticket asks for a fact → look it up live (WebSearch/WebFetch) and cite the source URL. Prefer official sources; if none is reachable, cite two agreeing secondary sources and say so. Figures from memory must be labeled unverified.
   - Ticket asks for files → write them, commit, `git push origin main`.
5. **Check against the ask.** Re-read the sentence from step 3. Same subject, same entity, same format? If the user changed the subject on purpose, note it on the parent ticket instead of quietly diverging.
6. **Close out, children first.** For each issue you created: tick its completed checkboxes and close it if the ticket says to. Then close the parent ticket with one `gh issue close --comment` linking the evidence (issue URL, comment URL, or commit SHA). Confirm with `gh issue view` that the states and links are right.
7. **Next ticket**, back to step 2.

## Confirm First
Ask before you close a ticket you didn't finish, delete or rename the instructor's issues, or force-push. Creating, commenting on, and closing tickets the loop has finished is in scope.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Working in a folder that isn't a clone, so `gh` can't find the repo | Clone it, or always pass `-R <org>/<repo>` |
| Posting population or other facts from memory | Verify live and cite a URL, or mark them unverified |
| Editing the deliverable afterwards so it no longer matches the parent ticket | Re-run step 5 after any change; comment on the parent ticket |
| Closing the parent ticket with no link | The close comment must point at the evidence |
| Work only in local files | Push to `main`; local work scores zero |
