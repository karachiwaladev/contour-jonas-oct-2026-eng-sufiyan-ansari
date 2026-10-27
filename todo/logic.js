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
  function filterTasks(tasks, { status = 'all', tag = '', priority = '' } = {}) {
    return tasks.filter((t) => {
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

  return { PRIORITIES, parseTags, availableTags, priorityOf, filterTasks, isOverdue, nextDue, nextOccurrence };
})();

if (typeof module !== 'undefined') module.exports = TodoLogic;
