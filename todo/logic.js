// Pure task logic, shared by the browser (global TodoLogic) and Node tests (module.exports).
const TodoLogic = (() => {
  // "Work, #urgent, work" -> ["work", "urgent"]
  function parseTags(text) {
    const tags = text
      .split(',')
      .map((t) => t.trim().replace(/^#/, '').toLowerCase())
      .filter(Boolean);
    return [...new Set(tags)];
  }

  function availableTags(tasks) {
    return [...new Set(tasks.flatMap((t) => t.tags || []))].sort();
  }

  const PRIORITIES = ['high', 'medium', 'low'];

  // Tasks created before priorities existed (or with a bad value) count as medium.
  function priorityOf(task) {
    return PRIORITIES.includes(task.priority) ? task.priority : 'medium';
  }

  // status: 'all' | 'incomplete' | 'completed'; tag and priority: '' means any.
  // query: case-insensitive substring of the title; blank means any.
  function filterTasks(tasks, { status = 'all', tag = '', priority = '', query = '' } = {}) {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (status === 'incomplete' && t.done) return false;
      if (status === 'completed' && !t.done) return false;
      if (tag && !(t.tags || []).includes(tag)) return false;
      if (priority && priorityOf(t) !== priority) return false;
      return true;
    });
  }

  // Dates are ISO "YYYY-MM-DD" strings, so string comparison orders them correctly.
  function isOverdue(task, today) {
    return !task.done && Boolean(task.due) && task.due < today;
  }

  // repeat: 'daily' | 'weekly' | 'monthly'. Works in UTC so time zones can't shift the date.
  // Monthly keeps the day of month, clamped to the target month's length (Jan 31 -> Feb 28).
  function nextDue(due, repeat) {
    const [y, m, d] = due.split('-').map(Number);
    let date;
    if (repeat === 'daily') date = new Date(Date.UTC(y, m - 1, d + 1));
    else if (repeat === 'weekly') date = new Date(Date.UTC(y, m - 1, d + 7));
    else if (repeat === 'monthly') {
      const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      date = new Date(Date.UTC(y, m, Math.min(d, lastDay)));
    } else throw new Error(`Unknown repeat: ${repeat}`);
    return date.toISOString().slice(0, 10);
  }

  // The task to create when a recurring task is completed, or null if none is due.
  // `recurred` marks a task whose next occurrence already exists, so re-checking it doesn't duplicate.
  function nextOccurrence(task, today, now) {
    if (!task.repeat || task.repeat === 'none' || task.recurred) return null;
    return {
      title: task.title,
      done: false,
      due: nextDue(task.due || today, task.repeat),
      tags: task.tags || [],
      repeat: task.repeat,
      priority: priorityOf(task),
      createdAt: now,
    };
  }

  function countTasks(tasks) {
    const done = tasks.filter((t) => t.done).length;
    return { open: tasks.length - done, done };
  }

  const SORTS = { created: 'Newest first', due: 'Due date', priority: 'Priority' };

  // Newest first; tasks from before createdAt existed count as oldest, then by id.
  const byNewest = (a, b) => (b.createdAt || 0) - (a.createdAt || 0) || (b.id || 0) - (a.id || 0);

  const COMPARE = {
    created: byNewest,
    // Soonest due first; tasks without a due date go last.
    due: (a, b) => {
      if (a.due && b.due) return a.due < b.due ? -1 : a.due > b.due ? 1 : 0;
      return Boolean(b.due) - Boolean(a.due);
    },
    priority: (a, b) => PRIORITIES.indexOf(priorityOf(a)) - PRIORITIES.indexOf(priorityOf(b)),
  };

  // sort: a key of SORTS; anything else falls back to 'created'. Returns a new array.
  function sortTasks(tasks, sort = 'created') {
    const compare = Object.hasOwn(COMPARE, sort) ? COMPARE[sort] : byNewest;
    return [...tasks].sort((a, b) => compare(a, b) || byNewest(a, b));
  }

  return { PRIORITIES, SORTS, parseTags, availableTags, priorityOf, filterTasks, sortTasks, isOverdue, nextDue, nextOccurrence, countTasks };
})();

if (typeof module !== 'undefined') module.exports = TodoLogic;
