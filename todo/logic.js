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

  // status: 'all' | 'incomplete' | 'completed'; tag: '' means any tag.
  function filterTasks(tasks, { status = 'all', tag = '' } = {}) {
    return tasks.filter((t) => {
      if (status === 'incomplete' && t.done) return false;
      if (status === 'completed' && !t.done) return false;
      if (tag && !(t.tags || []).includes(tag)) return false;
      return true;
    });
  }

  // Dates are ISO "YYYY-MM-DD" strings, so string comparison orders them correctly.
  function isOverdue(task, today) {
    return !task.done && Boolean(task.due) && task.due < today;
  }

  return { parseTags, availableTags, filterTasks, isOverdue };
})();

if (typeof module !== 'undefined') module.exports = TodoLogic;
