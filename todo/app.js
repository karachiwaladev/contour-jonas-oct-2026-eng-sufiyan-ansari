const form = document.getElementById('new-task');
const input = document.getElementById('title');
const list = document.getElementById('tasks');
const empty = document.getElementById('empty');

async function render() {
  const tasks = await TodoDB.all();
  list.replaceChildren(...tasks.map(renderTask));
  empty.hidden = tasks.length > 0;
}

function renderTask(task) {
  const li = document.createElement('li');
  li.className = task.done ? 'done' : '';

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = task.done;
  check.setAttribute('aria-label', `Mark "${task.title}" done`);
  check.addEventListener('change', async () => {
    await TodoDB.put({ ...task, done: check.checked });
    render();
  });

  const title = document.createElement('span');
  title.className = 'title';
  title.textContent = task.title;

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete';
  del.textContent = 'Delete';
  del.setAttribute('aria-label', `Delete "${task.title}"`);
  del.addEventListener('click', async () => {
    await TodoDB.remove(task.id);
    render();
  });

  li.append(check, title, del);
  return li;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  await TodoDB.add({ title, done: false, createdAt: Date.now() });
  form.reset();
  input.focus();
  render();
});

render();
