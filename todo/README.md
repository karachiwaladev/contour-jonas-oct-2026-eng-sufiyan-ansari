# Todo app

A small todo app that runs entirely in the browser. Tasks are stored client-side in IndexedDB, so there's no server or build step.

## Run

Open `todo/index.html` in a browser, or serve the folder:

```
python -m http.server -d todo 8000
```

## Features

- Create a task, with an optional due date and comma-separated tags
- Mark it done or not done
- Delete it
- Filter by status: All, Incomplete or Completed
- Filter by tag, from a dropdown of the tags in use; clicking a tag chip also filters by it
- Incomplete tasks past their due date are marked Overdue
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
| `logic.js` | Pure logic: `parseTags`, `availableTags`, `filterTasks`, `isOverdue`, `nextDue`, `nextOccurrence` |
| `logic.test.js` | Node tests for `logic.js` |
| `db.js` | IndexedDB wrapper (`TodoDB.all/add/put/remove`) |
| `app.js` | UI: renders tasks and filters, wires up events |
