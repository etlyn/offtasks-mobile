import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { StatisticsScreen } from '../src/features/completed/Completed.screen';
import type { Task } from '../src/types/task';

const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn(() => false);
const mockTasks: Task[] = [
  {
    id: 'a',
    content: 'Active plan',
    date: null,
    target_group: 'upcoming',
    priority: 0,
    isComplete: false,
    user_id: 'test',
  },
  {
    id: 'b',
    content: 'Finished plan',
    date: null,
    target_group: 'upcoming',
    priority: 0,
    isComplete: true,
    user_id: 'test',
  },
];
jest.mock('../src/providers/TasksProvider', () => ({
  useTasks: () => ({
    tasks: { today: mockTasks },
    totals: { completed: 1 },
    loading: false,
    refreshing: false,
    refresh: jest.fn(),
    applyTaskUpdate: jest.fn(),
  }),
}));
jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light', advancedMode: false }),
}));
jest.mock('../src/lib/taskRepository', () => ({
  useTaskRepository: () => ({ update: mockUpdate }),
}));
jest.mock('../src/hooks/useTaskCategories', () => ({
  normalizeCategory: (value: string) => value.trim(),
  useTaskCategories: () => ({
    categories: [],
    addCategory: jest.fn(),
    removeCategory: jest.fn(),
  }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: () => true,
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
  }),
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
jest.mock('../src/features/dashboard/components/TaskComposerModal', () => ({
  TaskComposerModal: () => null,
}));

test('statistics filters history and searches across both task states', async () => {
  render(<StatisticsScreen />);
  expect(screen.getByLabelText('Task: Active plan')).toBeTruthy();
  expect(screen.queryByLabelText('Task: Finished plan')).toBeNull();
  expect(screen.queryByLabelText('Delete task')).toBeNull();
  fireEvent.press(screen.getByRole('tab', { name: 'Completed' }));
  expect(screen.getByLabelText('Task: Finished plan')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Mark as incomplete'));
  await waitFor(() =>
    expect(mockUpdate).toHaveBeenCalledWith('b', {
      isComplete: false,
      completed_at: null,
    }),
  );
  fireEvent.changeText(screen.getByLabelText('Search all tasks'), 'Active');
  expect(screen.getByLabelText('Task: Active plan')).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('Search all tasks'), 'missing');
  expect(screen.getByText('No matching tasks')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Clear statistics search'));
  expect(screen.getByRole('tab', { name: 'Completed' })).toBeSelected();
  fireEvent.press(screen.getByLabelText('Back'));
  expect(mockNavigate).toHaveBeenCalledWith('Calendar');
});

test('statistics back returns to the previous page when history is available', () => {
  mockCanGoBack.mockReturnValue(true);
  render(<StatisticsScreen />);
  fireEvent.press(screen.getByLabelText('Back'));
  expect(mockGoBack).toHaveBeenCalledTimes(1);
  mockCanGoBack.mockReturnValue(false);
});

test('overview shows honest completion progress and compact task-state controls', () => {
  render(<StatisticsScreen />);
  expect(
    screen.getByLabelText('1 of 2 tasks completed, 50 percent'),
  ).toBeOnTheScreen();
  expect(screen.getByText('All-time progress')).toBeOnTheScreen();
  expect(screen.queryByText('Overdue')).toBeNull();
  expect(screen.getByText('No tasks in goals yet')).toBeOnTheScreen();
  fireEvent.press(screen.getByLabelText('View all goals'));
  expect(mockNavigate).toHaveBeenLastCalledWith('Goals', undefined);
  expect(screen.getByRole('tab', { name: 'Completed' })).toHaveStyle({
    minHeight: 44,
  });
});

test('statistics shows an assigned future date instead of a misleading Later label', () => {
  mockTasks[0].date = '2027-09-17';
  try {
    render(<StatisticsScreen />);
    expect(screen.getByText('Sep 17')).toBeOnTheScreen();
  } finally {
    mockTasks[0].date = null;
  }
});
