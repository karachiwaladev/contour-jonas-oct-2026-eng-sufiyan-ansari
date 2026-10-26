# Todo app

A small todo app that runs entirely in the browser. Tasks are stored client-side in IndexedDB, so there's no server or build step.

## Run

Open `todo/index.html` in a browser, or serve the folder:

```
python -m http.server -d todo 8000
```

## Features

- Create a task
- Mark it done or not done
- Delete it

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup |
| `style.css` | Styles (light and dark) |
| `db.js` | IndexedDB wrapper (`TodoDB.all/add/put/remove`) |
| `app.js` | UI: renders tasks and wires up events |
