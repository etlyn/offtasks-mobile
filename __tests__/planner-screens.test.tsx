import React from 'react';
import { Alert } from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotesScreen } from '../src/features/planner/Notes.screen';
import { GoalsScreen } from '../src/features/planner/Goals.screen';
import { MonthCalendar } from '../src/features/dashboard/components/MonthCalendar';
import { DashboardTabBar } from '../src/navigation/DashboardTabBar';
import { readPlanner, plannerKey } from '../src/lib/plannerSync';
import type { Task } from '../src/types/task';

jest.mock('../src/providers/AuthProvider', () => ({
  useAuth: () => ({ session: { user: { id: 'screen-test-user' } } }),
}));
jest.mock('../src/lib/supabase', () => ({
  supabaseClient: {
    from: jest.fn(() => {
      throw new Error('Offline test');
    }),
  },
}));
jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
jest.mock('../src/providers/TasksProvider', () => ({
  useTasks: () => ({
    tasks: { today: [], tomorrow: [], upcoming: [], close: [] },
    refreshing: false,
    refresh: jest.fn(),
  }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 48, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ dispatch: jest.fn() }),
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
}));
jest.mock('../src/features/dashboard/Dashboard.screen', () => {
  const NativeText = require('react-native').Text;
  return {
    DashboardScreen: ({
      route,
    }: {
      route: { params: { category: string } };
    }) => <NativeText>Goal tasks: {route.params.category}</NativeText>,
  };
});

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

test('shows Calendar, Notes, Goals and Later in order and emits tab navigation', () => {
  const names = ['Calendar', 'Notes', 'Goals', 'Later'];
  const navigate = jest.fn();
  const emit = jest.fn(() => ({ defaultPrevented: false }));
  const props = {
    state: { index: 0, routes: names.map(name => ({ key: name, name })) },
    descriptors: Object.fromEntries(
      names.map(name => [name, { options: { tabBarLabel: name } }]),
    ),
    navigation: { navigate, emit },
  } as unknown as React.ComponentProps<typeof DashboardTabBar>;
  render(<DashboardTabBar {...props} />);
  expect(
    screen.getAllByRole('tab').map(tab => tab.props.accessibilityLabel),
  ).toEqual(names);
  expect(screen.getByRole('tab', { name: 'Calendar' })).toBeSelected();
  fireEvent.press(screen.getByRole('tab', { name: 'Notes' }));
  expect(navigate).toHaveBeenCalledWith('Notes', undefined);
  expect(emit).toHaveBeenCalledWith({
    type: 'tabPress',
    target: 'Notes',
    canPreventDefault: true,
  });
  navigate.mockClear();
  fireEvent.press(screen.getByRole('tab', { name: 'Calendar' }));
  expect(navigate).not.toHaveBeenCalled();
  emit.mockReturnValueOnce({ defaultPrevented: true });
  fireEvent.press(screen.getByRole('tab', { name: 'Goals' }));
  expect(navigate).not.toHaveBeenCalled();
  fireEvent(screen.getByRole('tab', { name: 'Later' }), 'longPress');
  expect(emit).toHaveBeenLastCalledWith({
    type: 'tabLongPress',
    target: 'Later',
  });
});

test('creates, searches, pins, edits and deletes a note through the screen', async () => {
  render(<NotesScreen />);
  await screen.findByText('No notes yet');
  fireEvent.press(screen.getByLabelText('Add note'));
  expect(screen.getByLabelText('Save note')).toBeDisabled();
  fireEvent.changeText(screen.getByLabelText('Note title'), 'App ideas');
  fireEvent.changeText(
    screen.getByLabelText('Note body'),
    'Calendar and goals',
  );
  fireEvent.press(screen.getByLabelText('Save note'));
  await screen.findByLabelText('Open note App ideas');
  fireEvent.press(screen.getByLabelText('Pin App ideas'));
  await screen.findByLabelText('Unpin App ideas');
  fireEvent.press(screen.getByRole('tab', { name: 'Pinned' }));
  expect(screen.getByLabelText('Open note App ideas')).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('Search notes'), 'missing');
  expect(screen.getByText('No matching notes')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Clear note search'));
  fireEvent.press(screen.getByLabelText('Open note App ideas'));
  fireEvent.changeText(screen.getByLabelText('Note body'), 'Updated note');
  fireEvent.press(screen.getByLabelText('Save note'));
  await waitFor(async () =>
    expect((await readPlanner('screen-test-user', 'note'))[0].body).toBe(
      'Updated note',
    ),
  );
  fireEvent.press(screen.getByLabelText('Open note App ideas'));
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    buttons?.find(button => button.text === 'Delete')?.onPress?.();
  });
  fireEvent.press(screen.getByLabelText('Delete note'));
  await screen.findByText('No pinned notes');
  expect(await readPlanner('screen-test-user', 'note')).toEqual([]);
});

test('failed saves preserve the draft and corrupted storage disables creation', async () => {
  const view = render(<NotesScreen />);
  await screen.findByText('No notes yet');
  fireEvent.press(screen.getByLabelText('Add note'));
  fireEvent.changeText(screen.getByLabelText('Note title'), 'Keep this draft');
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest
    .spyOn(AsyncStorage, 'setItem')
    .mockRejectedValueOnce(new Error('Storage full'));
  fireEvent.press(screen.getByLabelText('Save note'));
  await waitFor(() =>
    expect(Alert.alert).toHaveBeenCalledWith(
      'Could not save notes',
      expect.any(String),
    ),
  );
  expect(screen.getByLabelText('Note title').props.value).toBe(
    'Keep this draft',
  );
  view.unmount();
  await AsyncStorage.setItem(plannerKey('screen-test-user', 'note'), '{bad');
  render(<NotesScreen />);
  await screen.findByText('Notes could not be loaded');
  expect(screen.getByLabelText('Add note')).toBeDisabled();
});

test('creates a goal and opens its task list', async () => {
  render(<GoalsScreen />);
  await waitFor(() =>
    expect(screen.getByLabelText('Add goal')).not.toBeDisabled(),
  );
  fireEvent.press(screen.getByLabelText('Add goal'));
  expect(screen.getByLabelText('Save goal')).toBeDisabled();
  fireEvent.changeText(screen.getByLabelText('Goal name'), 'Summer plans');
  fireEvent.press(screen.getByLabelText('Save goal'));
  await screen.findByText('Goal tasks: Summer Plans');
  expect(await readPlanner('screen-test-user', 'goal')).toContain(
    'Summer Plans',
  );
});

test('calendar renders the selected month and supports collapse, expand and today', () => {
  const onChange = jest.fn();
  const tasks: Task[] = [
    {
      id: 'calendar-task',
      content: 'Plan',
      date: '2026-08-22',
      isComplete: false,
      user_id: 'screen-test-user',
      target_group: 'upcoming',
      priority: 0,
    },
  ];
  render(<MonthCalendar day="2026-08-22" onChange={onChange} tasks={tasks} />);
  expect(
    screen.getByText('August 2026', { includeHiddenElements: true }),
  ).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: /23 August 2026/ }));
  expect(onChange).toHaveBeenCalledWith('2026-08-23');
  fireEvent.press(screen.getByLabelText('Collapse calendar'));
  expect(
    screen.queryByText('August 2026', { includeHiddenElements: true }),
  ).toBeNull();
  fireEvent.press(screen.getByLabelText('Expand calendar'));
  expect(
    screen.getByText('August 2026', { includeHiddenElements: true }),
  ).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Go to today'));
  expect(onChange).toHaveBeenCalledWith(
    expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
  );
});
