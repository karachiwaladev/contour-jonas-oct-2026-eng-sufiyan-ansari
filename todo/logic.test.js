// Run: node --test todo/logic.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseTags, availableTags, filterTasks, isOverdue } = require('./logic.js');

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
