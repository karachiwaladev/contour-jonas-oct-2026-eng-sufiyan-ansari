const form = document.getElementById('new-task');
const input = document.getElementById('title');
const dueInput = document.getElementById('due');
const tagsInput = document.getElementById('tags');
const repeatInput = document.getElementById('repeat');
const list = document.getElementById('tasks');
const empty = document.getElementById('empty');
const statusButtons = document.querySelectorAll('#status-filter button');
const tagFilter = document.getElementById('tag-filter');

const filter = { status: 'all', tag: '' };

function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

async function render() {
  const tasks = await TodoDB.all();
  renderTagOptions(TodoLogic.availableTags(tasks));
  const shown = TodoLogic.filterTasks(tasks, filter);
  list.replaceChildren(...shown.map(renderTask));
  empty.hidden = shown.length > 0;
  empty.textContent = tasks.length ? 'No tasks match these filters.' : 'No tasks yet.';
}

function renderTagOptions(tags) {
  // Drop a selected tag that no task has any more.
  if (filter.tag && !tags.includes(filter.tag)) filter.tag = '';
  const options = tags.map((tag) => new Option(`#${tag}`, tag));
  tagFilter.replaceChildren(new Option('All tags', ''), ...options);
  tagFilter.value = filter.tag;
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
  if (meta.childElementCount) body.append(meta);

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete';
  del.textContent = 'Delete';
  del.setAttribute('aria-label', `Delete "${task.title}"`);
  del.addEventListener('click', async () => {
    await TodoDB.remove(task.id);
    render();
  });

  li.append(check, body, del);
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

render();
