const form = document.getElementById('new-task');
const input = document.getElementById('title');
const dueInput = document.getElementById('due');
const tagsInput = document.getElementById('tags');
const repeatInput = document.getElementById('repeat');
const priorityInput = document.getElementById('priority');
const list = document.getElementById('tasks');
const empty = document.getElementById('empty');
const count = document.getElementById('count');
const statusButtons = document.querySelectorAll('#status-filter button');
const tagFilter = document.getElementById('tag-filter');
const priorityFilter = document.getElementById('priority-filter');
const search = document.getElementById('search');

const filter = { status: 'all', tag: '', priority: '', query: '' };
let editingId = null;

const REPEATS = { none: 'Does not repeat', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
const capitalize = (s) => s[0].toUpperCase() + s.slice(1);

function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

async function render() {
  const tasks = await TodoDB.all();
  renderTagOptions(TodoLogic.availableTags(tasks));
  const shown = TodoLogic.filterTasks(tasks, filter);
  list.replaceChildren(...shown.map((t) => (t.id === editingId ? renderEditor(t) : renderTask(t))));
  empty.hidden = shown.length > 0;
  empty.textContent = tasks.length ? 'No tasks match these filters.' : 'No tasks yet.';
  // Totals across all tasks, regardless of the active filters.
  const { open, done } = TodoLogic.countTasks(tasks);
  count.textContent = `${open} open · ${done} done`;
}

function renderTagOptions(tags) {
  // Drop a selected tag that no task has any more.
  if (filter.tag && !tags.includes(filter.tag)) filter.tag = '';
  const options = tags.map((tag) => new Option(`#${tag}`, tag));
  tagFilter.replaceChildren(new Option('All tags', ''), ...options);
  tagFilter.value = filter.tag;
}

function select(options, value, label) {
  const el = document.createElement('select');
  el.setAttribute('aria-label', label);
  for (const [v, text] of Object.entries(options)) el.append(new Option(text, v));
  el.value = value;
  return el;
}

function prioritySelect(value) {
  const options = Object.fromEntries(TodoLogic.PRIORITIES.map((p) => [p, `${capitalize(p)} priority`]));
  return select(options, value, 'Priority');
}

function renderTask(task) {
  const li = document.createElement('li');
  li.className = task.done ? 'done' : '';

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = task.done;
  check.setAttribute('aria-label', `Mark "${task.title}" done`);
  check.addEventListener('change', async () => {
    const updated = { ...task, done: check.checked };
    // Completing a recurring task schedules its next occurrence, once.
    const next = check.checked ? TodoLogic.nextOccurrence(task, today(), Date.now()) : null;
    if (next) {
      updated.recurred = true;
      await TodoDB.add(next);
    }
    await TodoDB.put(updated);
    render();
  });

  const body = document.createElement('div');
  body.className = 'body';
  const title = document.createElement('span');
  title.className = 'title';
  title.textContent = task.title;
  body.append(title);

  const meta = document.createElement('div');
  meta.className = 'meta';
  const priority = TodoLogic.priorityOf(task);
  const badge = document.createElement('span');
  badge.className = `priority priority-${priority}`;
  badge.textContent = capitalize(priority);
  badge.title = `${capitalize(priority)} priority`;
  meta.append(badge);
  if (task.due) {
    const due = document.createElement('span');
    const overdue = TodoLogic.isOverdue(task, today());
    due.className = overdue ? 'due overdue' : 'due';
    due.textContent = `${overdue ? 'Overdue' : 'Due'} ${task.due}`;
    meta.append(due);
  }
  if (task.repeat && task.repeat !== 'none') {
    const repeat = document.createElement('span');
    repeat.className = 'repeat';
    repeat.textContent = `Repeats ${task.repeat}`;
    meta.append(repeat);
  }
  for (const tag of task.tags || []) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'tag';
    chip.textContent = `#${tag}`;
    chip.title = `Show only #${tag}`;
    chip.addEventListener('click', () => {
      filter.tag = tag;
      render();
    });
    meta.append(chip);
  }
  body.append(meta);

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'edit';
  edit.textContent = 'Edit';
  edit.setAttribute('aria-label', `Edit "${task.title}"`);
  edit.addEventListener('click', () => {
    editingId = task.id;
    render();
  });

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete';
  del.textContent = 'Delete';
  del.setAttribute('aria-label', `Delete "${task.title}"`);
  del.addEventListener('click', async () => {
    await TodoDB.remove(task.id);
    render();
  });

  li.append(check, body, edit, del);
  return li;
}

// Inline edit form: title, due date, tags, repeat and priority.
function renderEditor(task) {
  const li = document.createElement('li');
  li.className = 'editing';
  const editor = document.createElement('form');
  editor.className = 'editor';

  const title = document.createElement('input');
  title.value = task.title;
  title.required = true;
  title.setAttribute('aria-label', 'Task title');
  const due = document.createElement('input');
  due.type = 'date';
  due.value = task.due || '';
  due.setAttribute('aria-label', 'Due date');
  const tags = document.createElement('input');
  tags.value = (task.tags || []).join(', ');
  tags.placeholder = 'Tags, comma separated';
  tags.setAttribute('aria-label', 'Tags');
  const repeat = select(REPEATS, task.repeat || 'none', 'Repeat');
  const priority = prioritySelect(TodoLogic.priorityOf(task));

  const save = document.createElement('button');
  save.type = 'submit';
  save.textContent = 'Save';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Cancel';
  const stopEditing = () => {
    editingId = null;
    render();
  };
  cancel.addEventListener('click', stopEditing);
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') stopEditing();
  });

  editor.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = title.value.trim();
    if (!text) return;
    await TodoDB.put({
      ...task,
      title: text,
      due: due.value || null,
      tags: TodoLogic.parseTags(tags.value),
      repeat: repeat.value,
      priority: priority.value,
    });
    stopEditing();
  });

  editor.append(title, due, tags, repeat, priority, save, cancel);
  li.append(editor);
  queueMicrotask(() => title.focus());
  return li;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  await TodoDB.add({
    title,
    done: false,
    due: dueInput.value || null,
    tags: TodoLogic.parseTags(tagsInput.value),
    repeat: repeatInput.value,
    priority: priorityInput.value,
    createdAt: Date.now(),
  });
  form.reset();
  input.focus();
  render();
});

statusButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filter.status = btn.dataset.status;
    statusButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    render();
  });
});

tagFilter.addEventListener('change', () => {
  filter.tag = tagFilter.value;
  render();
});

priorityFilter.addEventListener('change', () => {
  filter.priority = priorityFilter.value;
  render();
});

search.addEventListener('input', () => {
  filter.query = search.value;
  render();
});

render();
