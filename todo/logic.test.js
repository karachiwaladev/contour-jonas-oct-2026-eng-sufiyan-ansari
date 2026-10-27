// Run: node --test todo/logic.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseTags, availableTags, filterTasks, isOverdue, nextDue, nextOccurrence, priorityOf, countTasks, sortTasks, SORTS } = require('./logic.js');

const tasks = [
  { id: 1, title: 'a', done: false, tags: ['work', 'urgent'] },
  { id: 2, title: 'b', done: true, tags: ['home'] },
  { id: 3, title: 'c', done: false, tags: [] },
  { id: 4, title: 'd', done: true }, // created before tags existed
];
const ids = (list) => list.map((t) => t.id);

test('parseTags trims, lowercases, drops blanks and duplicates', () => {
  assert.deepEqual(parseTags(' Work, urgent ,,work, #Home '), ['work', 'urgent', 'home']);
  assert.deepEqual(parseTags(''), []);
});

test('availableTags is the sorted union of all task tags', () => {
  assert.deepEqual(availableTags(tasks), ['home', 'urgent', 'work']);
});

test('status filter: all, incomplete, completed', () => {
  assert.deepEqual(ids(filterTasks(tasks, { status: 'all' })), [1, 2, 3, 4]);
  assert.deepEqual(ids(filterTasks(tasks, { status: 'incomplete' })), [1, 3]);
  assert.deepEqual(ids(filterTasks(tasks, { status: 'completed' })), [2, 4]);
});

test('tag filter combines with status filter', () => {
  assert.deepEqual(ids(filterTasks(tasks, { status: 'all', tag: 'work' })), [1]);
  assert.deepEqual(ids(filterTasks(tasks, { status: 'completed', tag: 'work' })), []);
  assert.deepEqual(ids(filterTasks(tasks, { status: 'all', tag: '' })), [1, 2, 3, 4]);
});

test('isOverdue: incomplete task with a due date before today', () => {
  const today = '2026-10-26';
  assert.equal(isOverdue({ done: false, due: '2026-10-25' }, today), true);
  assert.equal(isOverdue({ done: false, due: '2026-10-26' }, today), false);
  assert.equal(isOverdue({ done: true, due: '2026-10-01' }, today), false);
  assert.equal(isOverdue({ done: false }, today), false);
});

test('nextDue advances by day, week or month', () => {
  assert.equal(nextDue('2026-10-26', 'daily'), '2026-10-27');
  assert.equal(nextDue('2026-10-31', 'daily'), '2026-11-01');
  assert.equal(nextDue('2026-12-29', 'weekly'), '2027-01-05');
  assert.equal(nextDue('2026-10-15', 'monthly'), '2026-11-15');
  assert.equal(nextDue('2026-12-15', 'monthly'), '2027-01-15');
});

test('nextDue monthly clamps to the last day of a shorter month', () => {
  assert.equal(nextDue('2026-01-31', 'monthly'), '2026-02-28');
  assert.equal(nextDue('2028-01-31', 'monthly'), '2028-02-29');
});

test('nextOccurrence copies a recurring task with the next due date', () => {
  const task = { id: 9, title: 'Pay rent', done: true, due: '2026-10-01', tags: ['home'], repeat: 'monthly' };
  const next = nextOccurrence(task, '2026-10-26', 123);
  assert.deepEqual(next, {
    title: 'Pay rent', done: false, due: '2026-11-01', tags: ['home'], repeat: 'monthly', priority: 'medium', createdAt: 123,
  });
});

test('nextOccurrence counts from today when there is no due date', () => {
  const task = { title: 'Stretch', done: true, due: null, tags: [], repeat: 'daily' };
  assert.equal(nextOccurrence(task, '2026-10-26', 1).due, '2026-10-27');
});

test('nextOccurrence is null for non-recurring or already-repeated tasks', () => {
  assert.equal(nextOccurrence({ title: 'x', done: true }, '2026-10-26', 1), null);
  assert.equal(nextOccurrence({ title: 'x', done: true, repeat: 'none' }, '2026-10-26', 1), null);
  assert.equal(nextOccurrence({ title: 'x', done: true, repeat: 'daily', recurred: true }, '2026-10-26', 1), null);
});

test('priorityOf defaults to medium for tasks without a valid priority', () => {
  assert.equal(priorityOf({ priority: 'high' }), 'high');
  assert.equal(priorityOf({ priority: 'low' }), 'low');
  assert.equal(priorityOf({}), 'medium');
  assert.equal(priorityOf({ priority: 'bogus' }), 'medium');
});

test('priority filter combines with status and tag filters', () => {
  const list = [
    { id: 1, done: false, tags: ['work'], priority: 'high' },
    { id: 2, done: true, tags: ['work'], priority: 'high' },
    { id: 3, done: false, tags: [], priority: 'low' },
    { id: 4, done: false }, // created before priority existed -> medium
  ];
  assert.deepEqual(ids(filterTasks(list, { priority: 'high' })), [1, 2]);
  assert.deepEqual(ids(filterTasks(list, { priority: 'medium' })), [4]);
  assert.deepEqual(ids(filterTasks(list, { priority: 'high', status: 'incomplete', tag: 'work' })), [1]);
  assert.deepEqual(ids(filterTasks(list, { priority: '' })), [1, 2, 3, 4]);
});

test('nextOccurrence keeps the priority', () => {
  const task = { title: 'x', done: true, due: '2026-10-26', repeat: 'daily', priority: 'high' };
  assert.equal(nextOccurrence(task, '2026-10-26', 1).priority, 'high');
});

test('countTasks counts open and done tasks', () => {
  assert.deepEqual(countTasks(tasks), { open: 2, done: 2 });
  assert.deepEqual(countTasks([]), { open: 0, done: 0 });
});

test('search query matches any part of the title, case-insensitively', () => {
  const list = [
    { id: 1, title: 'Pay Rent', done: false, tags: ['home'] },
    { id: 2, title: 'Buy groceries', done: true, tags: ['home'] },
    { id: 3, title: 'Parent meeting', done: false, tags: ['work'] },
  ];
  assert.deepEqual(ids(filterTasks(list, { query: 'rent' })), [1, 3]);
  assert.deepEqual(ids(filterTasks(list, { query: '  GROC ' })), [2]);
  assert.deepEqual(ids(filterTasks(list, { query: 'rent', tag: 'work' })), [3]);
  assert.deepEqual(ids(filterTasks(list, { query: 'rent', status: 'incomplete', tag: 'home' })), [1]);
  assert.deepEqual(ids(filterTasks(list, { query: '' })), [1, 2, 3]);
  assert.deepEqual(ids(filterTasks(list, { query: 'zzz' })), []);
});

const sortable = [
  { id: 1, title: 'a', done: false, due: '2026-11-05', priority: 'low', createdAt: 100 },
  { id: 2, title: 'b', done: true, due: null, priority: 'high', createdAt: 300 },
  { id: 3, title: 'c', done: false, due: '2026-11-01', createdAt: 200 }, // no priority: medium
  { id: 4, title: 'd', done: false, due: '2026-11-01', priority: 'high', createdAt: 400 },
];

test('sortTasks defaults to creation date, newest first', () => {
  assert.deepEqual(ids(sortTasks(sortable)), [4, 2, 3, 1]);
  assert.deepEqual(ids(sortTasks(sortable, 'created')), [4, 2, 3, 1]);
  assert.deepEqual(ids(sortTasks(sortable, 'bogus')), [4, 2, 3, 1]);
  assert.deepEqual(ids(sortTasks(sortable, 'toString')), [4, 2, 3, 1]);
});

test('sortTasks by due date puts the soonest first and undated tasks last', () => {
  assert.deepEqual(ids(sortTasks(sortable, 'due')), [4, 3, 1, 2]);
});

test('sortTasks by priority goes high, medium, low', () => {
  assert.deepEqual(ids(sortTasks(sortable, 'priority')), [4, 2, 3, 1]);
  const list = [
    { id: 1, priority: 'low', createdAt: 1 },
    { id: 2, createdAt: 2 },
    { id: 3, priority: 'high', createdAt: 3 },
  ];
  assert.deepEqual(ids(sortTasks(list, 'priority')), [3, 2, 1]);
});

test('sortTasks does not modify its input', () => {
  const before = ids(sortable);
  sortTasks(sortable, 'due');
  assert.deepEqual(ids(sortable), before);
});

test('sorting combines with the filters', () => {
  const shown = sortTasks(filterTasks(sortable, { status: 'incomplete', query: '' }), 'due');
  assert.deepEqual(ids(shown), [4, 3, 1]);
  assert.deepEqual(ids(sortTasks(filterTasks(sortable, { priority: 'high' }), 'due')), [4, 2]);
});

test('tasks without createdAt sort as oldest, by id', () => {
  const list = [{ id: 1 }, { id: 2 }, { id: 3, createdAt: 5 }];
  assert.deepEqual(ids(sortTasks(list)), [3, 2, 1]);
});

test('SORTS lists the sort options with creation date first', () => {
  assert.deepEqual(Object.keys(SORTS), ['created', 'due', 'priority']);
});
