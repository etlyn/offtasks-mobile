import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  CompletionRing,
  StatisticsOverview,
} from '../src/features/completed/StatisticsOverview';
import { EmojiCelebration } from '../src/features/completed/EmojiCelebration';
import type { Task } from '../src/types/task';
jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({ reduceMotion: true }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 48, bottom: 34, left: 0, right: 0 }),
}));
const task = (id: string, label: string | null, complete: boolean): Task => ({
  id,
  label,
  isComplete: complete,
  user_id: 'test',
  content: id,
  date: null,
  priority: 0,
  target_group: 'upcoming',
});

test('goal progress counts actual tasks, including labels not in the saved goal list', () => {
  const openGoal = jest.fn();
  const celebrate = jest.fn();
  render(
    <StatisticsOverview
      tasks={[
        task('a', 'Work', true),
        task('b', 'work', false),
        task('c', null, true),
        task('d', 'Health', true),
      ]}
      categories={['Work', 'Empty']}
      onGoal={openGoal}
      onCelebrate={celebrate}
    />,
  );
  expect(
    screen.getByLabelText('3 of 4 tasks completed, 75 percent'),
  ).toBeOnTheScreen();
  expect(screen.getByText('1/2 complete')).toBeOnTheScreen();
  fireEvent.press(screen.getByLabelText(/Goal Work, 1 of 2 completed/i));
  expect(openGoal).toHaveBeenCalledWith(expect.stringMatching(/^work$/i));
  expect(screen.queryByText('Empty')).toBeNull();
  fireEvent.press(screen.getByLabelText('Celebrate progress'));
  expect(celebrate).toHaveBeenCalledTimes(1);
});

test('empty statistics never imply completion or enable a celebration', () => {
  render(
    <StatisticsOverview
      tasks={[]}
      categories={['Work']}
      onGoal={jest.fn()}
      onCelebrate={jest.fn()}
    />,
  );
  expect(screen.getByLabelText('No tasks yet')).toBeOnTheScreen();
  expect(screen.queryByText('100%')).toBeNull();
  expect(screen.getByLabelText('Celebrate progress')).toBeDisabled();
});

test('full completion has a complete ring and valid percentage', () => {
  render(<CompletionRing completed={4} total={4} />);
  expect(
    screen.getByLabelText('4 of 4 tasks completed, 100 percent'),
  ).toBeOnTheScreen();
});

test('Reduce Motion replaces flying emoji with a brief static acknowledgement, and blur clears it', () => {
  jest.useFakeTimers();
  const view = render(<EmojiCelebration trigger={1} active reduceMotion />);
  expect(
    screen.getByTestId('statistics-static-celebration', {
      includeHiddenElements: true,
    }),
  ).toBeTruthy();
  act(() => jest.advanceTimersByTime(1400));
  expect(
    screen.queryByTestId('statistics-celebration', {
      includeHiddenElements: true,
    }),
  ).toBeNull();
  view.rerender(<EmojiCelebration trigger={2} active reduceMotion />);
  view.rerender(<EmojiCelebration trigger={2} active={false} reduceMotion />);
  view.rerender(<EmojiCelebration trigger={2} active reduceMotion />);
  expect(
    screen.queryByTestId('statistics-celebration', {
      includeHiddenElements: true,
    }),
  ).toBeNull();
  view.unmount();
  jest.useRealTimers();
});
