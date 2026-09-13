import React from 'react';
import { Text, Pressable } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PreferencesProvider,
  usePreferences,
} from '../src/providers/PreferencesProvider';
let mockOwner = 'one';
jest.mock('../src/providers/AuthProvider', () => ({
  useAuth: () => ({ session: { user: { id: mockOwner } } }),
}));
jest.mock('../src/lib/widgetBridge', () => ({
  publishWidgetTheme: async () => {},
}));
jest.mock('../src/lib/supabase', () => ({
  fetchUserPreferences: async () => ({
    theme_mode: 'Light',
    auto_arrange: true,
    advanced_mode: true,
    hide_completed: true,
  }),
  upsertUserPreferences: async () => {},
}));
function Probe() {
  const prefs = usePreferences();
  return (
    <>
      <Text>{prefs.movePastTasksToLater ? 'Enabled' : 'Disabled'}</Text>
      <Pressable
        accessibilityLabel="Enable"
        onPress={() => prefs.setMovePastTasksToLater(true)}
      />
    </>
  );
}
test('retired settings cannot opt in; the new choice persists separately per account', async () => {
  await AsyncStorage.clear();
  await AsyncStorage.multiSet([
    ['offtasks:auto-arrange:one', 'true'],
    ['offtasks:advanced-mode:one', 'true'],
    ['offtasks:hide-completed:one', 'true'],
  ]);
  const view = render(
    <PreferencesProvider>
      <Probe />
    </PreferencesProvider>,
  );
  await act(async () => {});
  expect(screen.getByText('Disabled')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Enable'));
  await waitFor(async () =>
    expect(
      await AsyncStorage.getItem('offtasks:move-past-tasks-to-later:one'),
    ).toBe('true'),
  );
  mockOwner = 'two';
  view.rerender(
    <PreferencesProvider>
      <Probe />
    </PreferencesProvider>,
  );
  expect(screen.getByText('Disabled')).toBeTruthy();
  await act(async () => {});
  expect(
    await AsyncStorage.getItem('offtasks:move-past-tasks-to-later:two'),
  ).toBe('false');
  expect(
    await AsyncStorage.getItem('offtasks:move-past-tasks-to-later:one'),
  ).toBe('true');
});
