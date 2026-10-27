# Todo app

A small todo app that runs entirely in the browser. Tasks are stored client-side in IndexedDB, so there's no server or build step.

## Run

Open `todo/index.html` in a browser, or serve the folder:

```
python -m http.server -d todo 8000
```

## Features

- Create a task, with an optional due date, comma-separated tags, repeat and priority (High, Medium or Low; default Medium)
- Edit a task inline: title, due date, tags, repeat and priority (Save, or Cancel/Escape)
- Mark it done or not done
- Delete it
- Filter by status: All, Incomplete or Completed
- Filter by tag, from a dropdown of the tags in use; clicking a tag chip also filters by it
- Filter by priority; tasks created before priorities existed count as Medium
- Search by title as you type (case-insensitive, any part of the title); combines with the other filters
- Sort by newest first (default), due date (soonest first, undated last) or priority (high to low); combines with the filters and is remembered across reloads
- Incomplete tasks past their due date are marked Overdue
- Footer shows how many tasks are open and how many are done (all tasks, ignoring filters)
- Recurring tasks: repeat daily, weekly or monthly. Completing one creates the next occurrence, due one interval after its due date (or after today if it has none). Monthly keeps the day of month, clamped to shorter months

## Test

```
node --test todo/logic.test.js
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup |
| `style.css` | Styles (light and dark) |
| `logic.js` | Pure logic: `parseTags`, `availableTags`, `priorityOf`, `filterTasks`, `sortTasks`, `isOverdue`, `nextDue`, `nextOccurrence`, `countTasks` |
| `logic.test.js` | Node tests for `logic.js` |
| `db.js` | IndexedDB wrapper (`TodoDB.all/add/put/remove`) |
| `app.js` | UI: renders tasks, filters, sort and the inline editor; wires up events (sort choice saved in localStorage) |
