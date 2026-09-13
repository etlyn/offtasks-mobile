import React from 'react';
import { Animated } from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { searchEverything } from '../src/utils/globalSearch';
import { GlobalSearchOverlay } from '../src/features/search/GlobalSearchOverlay';
import { readPlanner } from '../src/lib/plannerSync';
import type { Task } from '../src/types/task';
import type { Note } from '../src/lib/notes';

const mockTasks: Task[] = [
  {
    id: '1',
    user_id: 'search-user',
    content: 'Launch task',
    isComplete: false,
    target_group: 'today',
    date: '2026-09-12',
    priority: 0,
    label: 'Launch goal',
  },
  {
    id: '2',
    user_id: 'search-user',
    content: 'Launch archived task',
    isComplete: true,
    target_group: 'close',
    date: null,
    priority: 0,
  },
];
const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Launch note',
    body: 'Useful ideas',
    pinned: false,
    updatedAt: '2026-09-12T00:00:00Z',
  },
  {
    id: '2',
    title: 'Other note',
    body: 'Launch details live in the body',
    pinned: true,
    updatedAt: '2026-09-12T00:00:00Z',
  },
];
jest.mock('../src/providers/TasksProvider', () => ({
  useTasks: () => ({ tasks: { today: mockTasks }, refresh: jest.fn() }),
}));
jest.mock('../src/providers/AuthProvider', () => ({
  useAuth: () => ({ session: { user: { id: 'search-user' } } }),
}));
jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 48, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({
    reduceMotion: true,
    animateLayout: jest.fn(),
  }),
}));
jest.mock('../src/lib/plannerSync', () => ({
  readPlanner: jest.fn((_user: string, kind: string) =>
    Promise.resolve(kind === 'note' ? mockNotes : ['Launch goal']),
  ),
  subscribePlanner: () => jest.fn(),
  syncPlanner: jest.fn().mockResolvedValue(undefined),
}));

test('global search combines all types, completed tasks and note bodies without page filters', () => {
  const results = searchEverything(
    mockTasks,
    mockNotes,
    ['Launch goal'],
    '  LAUNCH  ',
  );
  expect(results).toHaveLength(5);
  expect(new Set(results.map(item => item.kind))).toEqual(
    new Set(['task', 'note', 'goal']),
  );
  expect(results.map(item => item.key)).toContain('task:2');
  expect(results.map(item => item.key)).toContain('note:2');
  expect(new Set(results.map(item => item.key)).size).toBe(5);
});
test('search deduplicates label-backed goals and ranks title matches before body matches', () => {
  const results = searchEverything(
    mockTasks,
    mockNotes,
    ['Launch goal', 'launch goal'],
    'launch',
  );
  expect(results.filter(item => item.kind === 'goal')).toHaveLength(1);
  expect(results.at(-1)?.title).toBe('Other note');
  expect(searchEverything(mockTasks, mockNotes, [], 'launch task')[0].key).toBe(
    'task:1',
  );
  expect(searchEverything(mockTasks, mockNotes, [], '  ')).toEqual([]);
  expect(searchEverything(mockTasks, mockNotes, [], 'zzzz')).toEqual([]);
});

test('one filter-free field displays mixed results and opens each item type', async () => {
  const onSelect = jest.fn();
  const onClose = jest.fn();
  const progress = new Animated.Value(1);
  render(
    <GlobalSearchOverlay
      transition={{ progress, fieldProgress: progress, ready: true }}
      onSelect={onSelect}
      onClose={onClose}
    />,
  );
  await screen.findByText('Tasks, notes and goals');
  const input = screen.getByLabelText('Search');
  fireEvent.changeText(input, 'Launch');
  await screen.findByRole('button', { name: 'Open note Launch note' });
  expect(
    screen.getAllByRole('button', { name: /^Open (task|note|goal) / }),
  ).toHaveLength(5);
  expect(screen.queryAllByRole('tab')).toHaveLength(0);
  expect(screen.queryByLabelText(/filter/i)).toBeNull();
  expect(screen.getAllByLabelText('Search')).toHaveLength(1);
  for (const [kind, title] of [
    ['task', 'Launch task'],
    ['note', 'Launch note'],
    ['goal', 'Launch goal'],
  ]) {
    fireEvent.press(
      screen.getByRole('button', { name: `Open ${kind} ${title}` }),
    );
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind, title }),
    );
  }
  fireEvent.changeText(input, 'not found');
  await screen.findByText('No matches');
  fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
  expect(input.props.value).toBe('');
  fireEvent.press(screen.getByRole('button', { name: 'Close search' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('partial planner failure keeps available matches and reports incomplete results', async () => {
  jest
    .mocked(readPlanner)
    .mockImplementation((_user: string, kind: 'note' | 'goal') =>
      kind === 'note'
        ? Promise.reject(new Error('Unreadable'))
        : (Promise.resolve(['Launch goal']) as never),
    );
  const progress = new Animated.Value(1);
  render(
    <GlobalSearchOverlay
      transition={{ progress, fieldProgress: progress, ready: true }}
      onSelect={jest.fn()}
      onClose={jest.fn()}
    />,
  );
  await screen.findByText('Some items couldn’t be loaded.');
  fireEvent.changeText(screen.getByLabelText('Search'), 'Launch');
  await waitFor(() =>
    expect(screen.getAllByRole('button', { name: /^Open / })).toHaveLength(3),
  );
  expect(screen.getByRole('button', { name: 'Retry' })).toBeOnTheScreen();
});
