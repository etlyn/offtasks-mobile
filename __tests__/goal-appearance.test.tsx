import React from 'react';
import { Alert, Modal } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  defaultGoalAppearance,
  goalAppearanceKey,
  readGoalAppearances,
  surpriseGoalAppearance,
  writeGoalAppearance,
} from '../src/lib/goalAppearance';
import { GoalAppearanceSheet } from '../src/features/planner/GoalAppearanceSheet';
import { GoalRow } from '../src/features/planner/GoalRow';
import { readPlanner, writePlanner } from '../src/lib/plannerSync';
import { GUEST_ID } from '../src/lib/localTasks';

jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({
    reduceMotion: true,
    animateLayout: jest.fn(),
  }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 48, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('../src/lib/supabase', () => ({
  supabaseClient: { from: jest.fn() },
}));
beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

test('new users start empty, while existing saved goals are preserved', async () => {
  expect(await readPlanner(GUEST_ID, 'goal')).toEqual([]);
  await writePlanner(GUEST_ID, 'goal', ['Work', 'My own goal']);
  expect(await readPlanner(GUEST_ID, 'goal')).toEqual(['Work', 'My own goal']);
});

test('appearance persists per account, merges concurrent goals, and handles unusual names', async () => {
  await Promise.all([
    writeGoalAppearance('a', 'Travel', { color: 2, emoji: '🌎' }),
    writeGoalAppearance('a', '__proto__', { color: 1, emoji: null }),
  ]);
  expect(await readGoalAppearances('a')).toEqual(
    JSON.parse(
      '{"travel":{"color":2,"emoji":"🌎"},"__proto__":{"color":1,"emoji":null}}',
    ),
  );
  expect(await readGoalAppearances('b')).toEqual({});
  await writeGoalAppearance('a', 'Travel', null);
  expect((await readGoalAppearances('a')).travel).toBeUndefined();
});

test('invalid saved appearance is never overwritten', async () => {
  await AsyncStorage.setItem(goalAppearanceKey('a'), '{broken');
  await expect(
    writeGoalAppearance('a', 'Travel', { color: 1, emoji: '🌎' }),
  ).rejects.toThrow();
  expect(await AsyncStorage.getItem(goalAppearanceKey('a'))).toBe('{broken');
});

test('surprise always changes color within the curated palette', () => {
  const initial = defaultGoalAppearance('Travel');
  for (let i = 0; i < 30; i++) {
    const next = surpriseGoalAppearance(initial);
    expect(next.color).not.toBe(initial.color);
    expect(next.color).toBeGreaterThanOrEqual(0);
    expect(next.color).toBeLessThan(6);
    expect(next.emoji).toBeTruthy();
  }
});

test('populated goals expose personalization and honest progress', () => {
  const open = jest.fn();
  render(
    <GoalRow
      goal={{ name: 'Travel', total: 4, completed: 1 }}
      onOpen={jest.fn()}
      onOptions={open}
      disabled={false}
      appearance={{ color: 2, emoji: '🌎' }}
    />,
  );
  expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({
    min: 0,
    max: 4,
    now: 1,
    text: '1 of 4 tasks completed',
  });
  expect(screen.getByText('1/4 done')).toBeOnTheScreen();
  fireEvent.press(screen.getByLabelText('Options for Travel'));
  expect(open).toHaveBeenCalledTimes(1);
});

test('appearance changes are staged, saving is guarded, and failed save keeps the draft', async () => {
  const close = jest.fn();
  const save = jest
    .fn()
    .mockRejectedValueOnce(new Error('Full'))
    .mockResolvedValue(undefined);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  render(
    <GoalAppearanceSheet
      name="Travel"
      total={4}
      initial={{ color: 0, emoji: null }}
      onClose={close}
      onSave={save}
      onRemove={jest.fn()}
    />,
  );
  fireEvent(screen.UNSAFE_getByType(Modal), 'show');
  expect(screen.queryByLabelText('Remove empty goal Travel')).toBeNull();
  fireEvent.press(screen.getByLabelText('Use 🌎 emoji'));
  fireEvent.press(screen.getByLabelText('Lilac color'));
  expect(save).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Save goal appearance'));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Lilac color')).toBeSelected();
  fireEvent.press(screen.getByLabelText('Save goal appearance'));
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  expect(save).toHaveBeenLastCalledWith({ color: 2, emoji: '🌎' });
});

test('closing appearance does not save a changed draft or ask for discard confirmation', async () => {
  const close = jest.fn();
  const save = jest.fn();
  const alert = jest.spyOn(Alert, 'alert');
  render(
    <GoalAppearanceSheet
      name="Travel"
      total={0}
      initial={{ color: 0, emoji: null }}
      onClose={close}
      onSave={save}
      onRemove={jest.fn()}
    />,
  );
  fireEvent(screen.UNSAFE_getByType(Modal), 'show');
  fireEvent.press(screen.getByLabelText('Surprise me'));
  fireEvent.press(screen.getByLabelText('Close goal appearance'));
  expect(close).toHaveBeenCalledTimes(1);
  expect(save).not.toHaveBeenCalled();
  expect(alert).not.toHaveBeenCalled();
  await act(async () => {});
});
