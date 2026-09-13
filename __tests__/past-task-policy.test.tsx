import React from 'react';
import { Text } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';
import { TasksProvider, useTasks } from '../src/providers/TasksProvider';
import { getToday, getAdjacentDay } from '../src/hooks/useDate';
import {
  normalizeScheduledDate,
  shouldMovePastTaskToLater,
} from '../src/utils/taskScheduling';
import { categorizeTasks } from '../src/utils/taskUtils';
import type { Task } from '../src/types/task';

let mockEnabled = false;
let mockRecords: Task[] = [];
const mockRepository = {
  read: jest.fn(async () => mockRecords),
  update: jest.fn(async (id: string, patch: Partial<Task>) => {
    mockRecords = mockRecords.map(task =>
      task.id === id ? { ...task, ...patch } : task,
    );
  }),
};
jest.mock('../src/lib/taskRepository', () => ({
  useTaskRepository: () => mockRepository,
}));
jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({
    movePastTasksToLater: mockEnabled,
    themeMode: 'Light',
    autoArrange: true,
  }),
}));
jest.mock('../src/lib/widgetBridge', () => ({
  publishWidgetSnapshot: async () => {},
}));
const task = (id: string, date: string | null, isComplete = false): Task => ({
  id,
  date,
  isComplete,
  content: id,
  target_group: 'upcoming',
  user_id: 'test',
  priority: 0,
});
function Probe() {
  const { tasks, loading } = useTasks();
  return <Text>{loading ? 'Loading' : JSON.stringify(tasks)}</Text>;
}
beforeEach(() => {
  mockEnabled = false;
  mockRecords = [];
  jest.clearAllMocks();
});

test('dates remain assigned by default, including legacy auto-arrange enabled', async () => {
  mockRecords = [task('past', getAdjacentDay(-2))];
  render(
    <TasksProvider>
      <Probe />
    </TasksProvider>,
  );
  await waitFor(() => expect(screen.getByText(/"id":"past"/)).toBeTruthy());
  expect(mockRepository.update).not.toHaveBeenCalled();
  expect(normalizeScheduledDate(getAdjacentDay(-2))).toBe(getAdjacentDay(-2));
});
test('opt-in moves only incomplete past dates to Later and is idempotent', async () => {
  mockEnabled = true;
  mockRecords = [
    task('past', getAdjacentDay(-2)),
    task('today', getToday()),
    task('future', getAdjacentDay(1)),
    task('done', getAdjacentDay(-2), true),
    task('later', null),
  ];
  const view = render(
    <TasksProvider>
      <Probe />
    </TasksProvider>,
  );
  await waitFor(() =>
    expect(mockRepository.update).toHaveBeenCalledWith('past', {
      date: null,
      target_group: 'upcoming',
    }),
  );
  await waitFor(() =>
    expect(screen.getByText(/"id":"past","date":null/)).toBeTruthy(),
  );
  expect(mockRepository.update).toHaveBeenCalledTimes(1);
  expect(shouldMovePastTaskToLater(mockRecords[0])).toBe(false);
  view.unmount();
});

test('display groups and widgets never carry old tasks into today', () => {
  const past = task('past', getAdjacentDay(-1));
  past.target_group = 'today';
  const future = task('future', getAdjacentDay(2));
  future.target_group = 'today';
  const done = task('done', getToday(), true);
  const groups = categorizeTasks([past, future, done]);
  expect(groups.today.map(item => item.id)).toEqual(['done']);
  expect(groups.close.map(item => item.id)).toEqual(['past']);
  expect(groups.upcoming.map(item => item.id)).toEqual(['future']);
  expect(past.date).toBe(getAdjacentDay(-1));
});
