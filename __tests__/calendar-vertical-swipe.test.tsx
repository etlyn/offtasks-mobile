import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import {
  fireGestureHandler,
  getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';
import { MonthCalendar } from '../src/features/dashboard/components/MonthCalendar';

jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  CALENDAR_TRANSITION_MS: 320,
  useCalendarTransition: () => ({
    reduceMotion: true,
    animateLayout: jest.fn(),
  }),
}));

async function drag(translationY: number, endState: State = State.END) {
  await act(async () => {
    fireGestureHandler(getByGestureTestId('calendar-vertical-drag'), [
      { state: State.BEGAN, translationY: 0 },
      { state: State.ACTIVE, translationY, velocityY: 0 },
      { state: endState, translationY, velocityY: 0 },
    ]);
    await Promise.resolve();
  });
}

test('vertical drags collapse and expand without changing the selected date', async () => {
  const onChange = jest.fn();
  render(<MonthCalendar day="2026-09-12" onChange={onChange} tasks={[]} />);
  await drag(-100);
  expect(screen.getByTestId('calendar-week')).toBeTruthy();
  expect(screen.getByLabelText(/Saturday, September 12, 2026/)).toBeTruthy();
  await drag(100);
  expect(screen.getByTestId('calendar-month')).toBeTruthy();
  expect(onChange).not.toHaveBeenCalled();
});

test('a short or cancelled drag leaves the calendar in its original state', async () => {
  render(<MonthCalendar day="2026-09-12" onChange={jest.fn()} tasks={[]} />);
  await drag(-10);
  expect(screen.getByTestId('calendar-month')).toBeTruthy();
  await drag(-150, State.CANCELLED);
  expect(screen.getByTestId('calendar-month')).toBeTruthy();
});

test('an added finger cancels a drag rather than changing the calendar', async () => {
  render(<MonthCalendar day="2026-09-12" onChange={jest.fn()} tasks={[]} />);
  await act(async () => {
    fireGestureHandler(getByGestureTestId('calendar-vertical-drag'), [
      { state: State.BEGAN, translationY: 0, numberOfPointers: 1 },
      { state: State.ACTIVE, translationY: -30, numberOfPointers: 1 },
      { state: State.ACTIVE, translationY: -150, numberOfPointers: 2 },
      {
        state: State.END,
        translationY: -150,
        velocityY: -600,
        numberOfPointers: 1,
      },
    ]);
    await Promise.resolve();
  });
  expect(screen.getByTestId('calendar-month')).toBeTruthy();
});
