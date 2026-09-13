import { goalSummaries, tasksForDay } from '../src/utils/planner';
import type { Task } from '../src/types/task';
import { authErrorMessage } from '../src/utils/authErrors';

const task = (
  id: string,
  date: string | null,
  isComplete = false,
  label: string | null = null,
): Task => ({
  id,
  date,
  isComplete,
  label,
  content: id,
  user_id: 'test-user',
  target_group: 'upcoming',
  priority: 0,
});

test('calendar keeps unfinished tasks on their exact assigned date', () => {
  const tasks = [
    task('overdue', '2026-08-20'),
    task('done', '2026-08-20', true),
    task('today', '2026-08-22'),
    task('later', null),
    task('future', '2026-08-23'),
  ];
  expect(
    tasksForDay(tasks, '2026-08-22', '2026-08-22').map(item => item.id),
  ).toEqual(['today']);
  expect(
    tasksForDay(tasks, '2026-08-20', '2026-08-22').map(item => item.id),
  ).toEqual(['overdue', 'done']);
  expect(
    tasksForDay(tasks, '2026-08-23', '2026-08-22').map(item => item.id),
  ).toEqual(['future']);
});

test('goals preserve task labels, empty lists and case-insensitive completion counts', () => {
  expect(
    goalSummaries(
      [task('first', null, false, 'Work'), task('second', null, true, 'work')],
      ['Home', 'Work'],
    ),
  ).toEqual([
    { name: 'Home', total: 0, completed: 0 },
    { name: 'work', total: 2, completed: 1 },
  ]);
});

test('network sign-in errors explain service reachability without changing credential failures', () => {
  expect(authErrorMessage(new TypeError('Network request failed'))).toContain(
    'sign-in service',
  );
  expect(authErrorMessage(new Error('Invalid login credentials'))).toBe(
    'Invalid login credentials',
  );
  expect(authErrorMessage(null)).toContain('try again');
});
