import React from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Dimensions,
  Modal,
  DeviceEventEmitter,
} from 'react-native';
import {
  fireEvent,
  act,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TaskCreationContext,
  type NoteCreationAction,
  type GoalCreationAction,
} from '../src/navigation/TaskCreationContext';
import { NotesScreen } from '../src/features/planner/Notes.screen';
import { NotesFilter } from '../src/features/planner/NotesFilter';
import { GoalsScreen } from '../src/features/planner/Goals.screen';
import { MonthCalendar } from '../src/features/dashboard/components/MonthCalendar';
import { DashboardTabBar } from '../src/navigation/DashboardTabBar';
import { readPlanner, writePlanner, plannerKey } from '../src/lib/plannerSync';
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

function NotesHarness() {
  const [noteAction, setNoteAction] = React.useState<NoteCreationAction | null>(
    null,
  );
  return (
    <TaskCreationContext.Provider
      value={{
        calendarDay: '2026-09-12',
        setCalendarDay: jest.fn(),
        openTask: jest.fn(),
        noteAction,
        setNoteAction,
      }}
    >
      <NotesScreen />
      <DashboardTabBar {...makeTabProps(1)} />
    </TaskCreationContext.Provider>
  );
}

const mockGoalTask = jest.fn();
function GoalsHarness() {
  const [goalAction, setGoalAction] = React.useState<GoalCreationAction | null>(
    null,
  );
  return (
    <TaskCreationContext.Provider
      value={{
        calendarDay: '2026-09-12',
        setCalendarDay: jest.fn(),
        openTask: mockGoalTask,
        goalAction,
        setGoalAction,
      }}
    >
      <GoalsScreen />
      <DashboardTabBar {...makeTabProps(2)} />
    </TaskCreationContext.Provider>
  );
}

beforeEach(async () => {
  mockGoalTask.mockClear();
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

const makeTabProps = (index = 0) => {
  const names = [
    'Calendar',
    'Notes',
    'Goals',
    'Later',
    'Statistics',
    'Account',
  ];
  return {
    state: { index, routes: names.map(name => ({ key: name, name })) },
    descriptors: Object.fromEntries(names.map(name => [name, { options: {} }])),
    navigation: {
      navigate: jest.fn(),
      emit: jest.fn(() => ({ defaultPrevented: false })),
    },
  } as unknown as React.ComponentProps<typeof DashboardTabBar>;
};

test.each([4, 5])(
  'drawer destination %s retains the same four-tab dock and global plus',
  async index => {
    const openTask = jest.fn();
    const props = makeTabProps(index);
    render(
      <TaskCreationContext.Provider
        value={{
          calendarDay: '2026-09-12',
          setCalendarDay: jest.fn(),
          openTask,
        }}
      >
        <DashboardTabBar {...props} />
      </TaskCreationContext.Provider>,
    );
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.queryByRole('tab', { name: 'Account' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Statistics' })).toBeNull();
    expect(screen.queryAllByRole('tab', { selected: true })).toHaveLength(0);
    fireEvent.press(screen.getByRole('button', { name: 'Add task' }));
    expect(openTask).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByRole('tab', { name: 'Notes' }));
    expect(props.navigation.navigate).toHaveBeenCalledWith('Notes', undefined);
    await act(async () => {});
  },
);

test('Notes filter stays visually compact without shrinking its touch targets', async () => {
  jest
    .spyOn(Dimensions, 'get')
    .mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 1 });
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  const timing = jest.spyOn(Animated, 'timing');
  const onChange = jest.fn();
  const view = render(<NotesFilter pinnedOnly={false} onChange={onChange} />);
  expect(screen.getByTestId('notes-filter-track')).toHaveStyle({
    height: 30,
    borderRadius: 15,
  });
  expect(screen.getByTestId('notes-filter')).toHaveStyle({
    width: 132,
    minHeight: 44,
  });
  for (const tab of screen.getAllByRole('tab'))
    expect(tab).toHaveStyle({ minHeight: 44 });
  fireEvent.press(screen.getByRole('tab', { name: 'All' }));
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('tab', { name: 'Pinned' }));
  expect(onChange).toHaveBeenCalledWith(true);
  view.rerender(<NotesFilter pinnedOnly onChange={onChange} />);
  await waitFor(() =>
    expect(screen.getByTestId('notes-filter-selection')).toHaveStyle({
      width: 64,
      top: 2,
      bottom: 2,
      left: 2,
      borderRadius: 13,
      transform: [{ translateX: 64 }],
    }),
  );
  expect(screen.getByRole('tab', { name: 'Pinned' })).toBeSelected();
  expect(timing).not.toHaveBeenCalled();
});

test('glass dock sizes its selection lens and respects Reduce Motion', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  const spring = jest.spyOn(Animated, 'spring');
  const view = render(<DashboardTabBar {...makeTabProps()} />);
  fireEvent(screen.getByTestId('main-tab-dock'), 'layout', {
    nativeEvent: { layout: { width: 300, height: 56, x: 0, y: 0 } },
  });
  expect(screen.getByTestId('main-tab-dock')).toHaveStyle({
    minHeight: 56,
    borderWidth: 0,
    padding: 4,
    borderRadius: 28,
  });
  expect(screen.getByTestId('tab-selection-lens')).toHaveStyle({
    width: (292 * 1.2) / 4.2,
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 24,
  });
  expect(screen.getByTestId('tab-selection-glass')).toHaveStyle({
    borderRadius: 24,
  });
  for (const tab of screen.getAllByRole('tab')) {
    expect(tab).toHaveStyle({ minHeight: 48 });
  }
  view.rerender(<DashboardTabBar {...makeTabProps(2)} />);
  await waitFor(() =>
    expect(screen.getByRole('tab', { name: 'Goals' })).toBeSelected(),
  );
  expect(screen.getByTestId('tab-selection-lens')).toHaveStyle({
    width: 292 / 4.2,
  });
  expect(spring).not.toHaveBeenCalled();
});

test('floating navigation hides for the keyboard and returns afterward', async () => {
  render(<DashboardTabBar {...makeTabProps(1)} />);
  act(() => DeviceEventEmitter.emit('keyboardDidShow', {}));
  expect(screen.queryByRole('tab', { name: 'Notes' })).toBeNull();
  act(() => DeviceEventEmitter.emit('keyboardDidHide', {}));
  await waitFor(() =>
    expect(screen.getByRole('tab', { name: 'Notes' })).toBeSelected(),
  );
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

test('global search requests open existing notes without modifying them', async () => {
  const note = {
    id: 'search-note',
    title: 'Existing note',
    body: 'Keep this body',
    pinned: false,
    updatedAt: '2026-09-12T00:00:00Z',
  };
  await writePlanner('screen-test-user', 'note', [note]);
  const route = { params: { openNoteRequest: { id: note.id, requestId: 1 } } };
  const view = render(<NotesScreen route={route} />);
  await screen.findByLabelText('Note title');
  expect(screen.getByLabelText('Note body').props.value).toBe(note.body);
  fireEvent(
    screen.UNSAFE_getAllByType(Modal).find(modal => modal.props.visible)!,
    'show',
  );
  fireEvent.press(screen.getByLabelText('Close note'));
  await waitFor(() => expect(screen.queryByLabelText('Note body')).toBeNull());
  view.rerender(<NotesScreen route={route} />);
  expect(screen.queryByLabelText('Note body')).toBeNull();
  expect(await readPlanner('screen-test-user', 'note')).toEqual([note]);
});

test('global search requests open the matching goal detail', async () => {
  await writePlanner('screen-test-user', 'goal', ['Travel']);
  render(
    <GoalsScreen
      route={{ params: { openGoalRequest: { id: 'Travel', requestId: 1 } } }}
    />,
  );
  await screen.findByText('Goal tasks: Travel');
});

test('creates, searches, pins, edits and deletes a note through the screen', async () => {
  render(<NotesHarness />);
  await screen.findByText('No notes yet');
  await waitFor(() => expect(screen.getByLabelText('Add note')).toBeEnabled());
  fireEvent.press(screen.getByLabelText('Add note'));
  fireEvent(
    screen.UNSAFE_getAllByType(Modal).find(modal => modal.props.visible)!,
    'show',
  );
  expect(screen.getByLabelText('Save note')).toBeDisabled();
  fireEvent.changeText(screen.getByLabelText('Note title'), 'App ideas');
  fireEvent.changeText(
    screen.getByLabelText('Note body'),
    'Calendar and goals',
  );
  fireEvent.press(screen.getByLabelText('Save note'));
  await screen.findByLabelText('Open note App ideas');
  await waitFor(() => expect(screen.queryByLabelText('Note body')).toBeNull());
  fireEvent.press(screen.getByLabelText('Pin App ideas'));
  await screen.findByLabelText('Unpin App ideas');
  fireEvent.press(screen.getByRole('tab', { name: 'Pinned' }));
  expect(screen.getByLabelText('Open note App ideas')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Search notes' }));
  await waitFor(() =>
    expect(screen.getByLabelText('Search notes').props.editable).toBe(true),
  );
  fireEvent.changeText(screen.getByLabelText('Search notes'), 'missing');
  expect(screen.getByText('No matching notes')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Clear note search'));
  fireEvent.press(screen.getByLabelText('Close search'));
  await waitFor(() =>
    expect(screen.queryByTestId('notes-search-overlay')).toBeNull(),
  );
  expect(screen.getByRole('tab', { name: 'Pinned' })).toBeSelected();
  await waitFor(() => expect(screen.queryByLabelText('Note body')).toBeNull());
  fireEvent.press(screen.getByLabelText('Open note App ideas'));
  fireEvent(
    screen.UNSAFE_getAllByType(Modal).find(modal => modal.props.visible)!,
    'show',
  );
  fireEvent.changeText(screen.getByLabelText('Note body'), 'Updated note');
  fireEvent.press(screen.getByLabelText('Save note'));
  await waitFor(async () =>
    expect((await readPlanner('screen-test-user', 'note'))[0].body).toBe(
      'Updated note',
    ),
  );
  fireEvent.press(screen.getByLabelText('Open note App ideas'));
  fireEvent(
    screen.UNSAFE_getAllByType(Modal).find(modal => modal.props.visible)!,
    'show',
  );
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    buttons?.find(button => button.text === 'Delete')?.onPress?.();
  });
  fireEvent.press(screen.getByLabelText('Delete note'));
  await screen.findByText('No pinned notes');
  expect(await readPlanner('screen-test-user', 'note')).toEqual([]);
});

test('Notes search stays behind its header icon and preserves the pinned list underneath', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  render(<NotesHarness />);
  await screen.findByText('No notes yet');
  expect(screen.queryByTestId('task-search-field')).toBeNull();
  expect(screen.queryByLabelText('Add task')).toBeNull();
  await waitFor(() => expect(screen.getByLabelText('Add note')).toBeEnabled());
  fireEvent.press(screen.getByLabelText('Add note'));
  fireEvent(
    screen.UNSAFE_getAllByType(Modal).find(modal => modal.props.visible)!,
    'show',
  );
  fireEvent.changeText(screen.getByLabelText('Note title'), 'Unpinned idea');
  fireEvent.press(screen.getByLabelText('Save note'));
  await screen.findByLabelText('Open note Unpinned idea');
  await waitFor(() => expect(screen.queryByLabelText('Note body')).toBeNull());
  fireEvent.press(screen.getByRole('tab', { name: 'Pinned' }));
  expect(screen.getByText('No pinned notes')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Search notes' }));
  await waitFor(() =>
    expect(screen.getByLabelText('Search notes').props.editable).toBe(true),
  );
  expect(
    screen.getByTestId('notes-underlay', { includeHiddenElements: true }).props
      .pointerEvents,
  ).toBe('none');
  expect(screen.getByText('All notes')).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('Search notes'), 'Unpinned');
  expect(screen.getByLabelText('Open note Unpinned idea')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Close search'));
  await waitFor(() =>
    expect(screen.queryByTestId('notes-search-overlay')).toBeNull(),
  );
  expect(screen.getByRole('tab', { name: 'Pinned' })).toBeSelected();
  expect(screen.getByText('No pinned notes')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Search notes' }));
  await waitFor(() =>
    expect(screen.getByLabelText('Search notes').props.value).toBe(''),
  );
});

test('failed saves preserve the draft and corrupted storage disables creation', async () => {
  const view = render(<NotesHarness />);
  await screen.findByText('No notes yet');
  fireEvent.press(screen.getByLabelText('Add note'));
  fireEvent(
    screen.UNSAFE_getAllByType(Modal).find(modal => modal.props.visible)!,
    'show',
  );
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
  render(<NotesHarness />);
  await screen.findByText('Notes could not be loaded');
  expect(screen.getByLabelText('Add note')).toBeDisabled();
});

test('Goals search is layered and empty-goal removal stays behind options', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  await writePlanner('screen-test-user', 'goal', ['Travel']);
  render(<GoalsHarness />);
  await screen.findByLabelText('Open goal Travel, 0 of 0 completed');
  expect(screen.queryByText('No tasks yet')).toBeNull();
  expect(screen.queryByLabelText('Remove empty goal Travel')).toBeNull();
  fireEvent.press(screen.getByLabelText('Options for Travel'));
  fireEvent(
    screen.UNSAFE_getAllByType(Modal).find(modal => modal.props.visible)!,
    'show',
  );
  expect(screen.getByLabelText('Remove empty goal Travel')).toBeOnTheScreen();
  fireEvent.press(screen.getByLabelText('Close goal appearance'));
  await waitFor(() =>
    expect(screen.queryByLabelText('Save goal appearance')).toBeNull(),
  );
  fireEvent.press(screen.getByRole('button', { name: 'Search goals' }));
  await waitFor(() =>
    expect(screen.getByLabelText('Search goals').props.editable).toBe(true),
  );
  fireEvent.changeText(screen.getByLabelText('Search goals'), 'missing');
  expect(screen.getByText('No matching goals')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Clear goal search'));
  expect(
    screen.getByLabelText('Open goal Travel, 0 of 0 completed'),
  ).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Close search'));
  await waitFor(() =>
    expect(screen.queryByTestId('goals-search-overlay')).toBeNull(),
  );
  expect(screen.getByLabelText('Add goal')).not.toBeDisabled();
});

test('creates a goal and opens its task list', async () => {
  render(<GoalsHarness />);
  await waitFor(() =>
    expect(screen.getByLabelText('Add goal')).not.toBeDisabled(),
  );
  fireEvent.press(screen.getByLabelText('Add goal'));
  fireEvent(
    screen.UNSAFE_getAllByType(Modal).find(modal => modal.props.visible)!,
    'show',
  );
  expect(screen.getByLabelText('Save goal')).toBeDisabled();
  fireEvent.changeText(screen.getByLabelText('Goal name'), 'Summer plans');
  fireEvent.press(screen.getByLabelText('Save goal'));
  await screen.findByText('Goal tasks: Summer Plans');
  await waitFor(() => expect(screen.getByLabelText('Add task')).toBeEnabled());
  fireEvent.press(screen.getByLabelText('Add task'));
  expect(mockGoalTask).toHaveBeenCalledWith(undefined, 'Summer Plans');
  expect(await readPlanner('screen-test-user', 'goal')).toContain(
    'Summer Plans',
  );
});

test('calendar starts expanded and supports collapse and today', async () => {
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
  expect(screen.getByTestId('calendar-month')).toBeTruthy();
  expect(
    screen.getByRole('button', { name: /August 22, 2026, has tasks/ }),
  ).toBeSelected();
  fireEvent.press(screen.getByRole('button', { name: /August 23, 2026/ }));
  expect(onChange).toHaveBeenCalledWith('2026-08-23');
  fireEvent.press(screen.getByLabelText('Collapse calendar'));
  expect(screen.getByTestId('calendar-week')).toBeTruthy();
  expect(screen.queryByTestId('calendar-footer')).toBeNull();
  expect(screen.queryByTestId('calendar-expand-row')).toBeNull();
  expect(screen.getByLabelText('Expand calendar')).toHaveStyle({
    minWidth: 72,
    minHeight: 44,
  });
  expect(screen.queryByText('August 2026')).toBeNull();
  expect(screen.queryByLabelText('Go to today')).toBeNull();
  expect(screen.queryByLabelText('Previous month')).toBeNull();
  fireEvent.press(screen.getByLabelText('Expand calendar'));
  expect(screen.getByTestId('calendar-month')).toBeTruthy();
  expect(screen.getByRole('button', { name: /August 1, 2026/ })).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Next month'));
  expect(screen.getByText('September 2026')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Previous month'));
  expect(screen.getByText('August 2026')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Collapse calendar'));
  expect(screen.getByTestId('calendar-week')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Expand calendar'));
  await waitFor(() =>
    expect(screen.getByTestId('calendar-month')).toBeTruthy(),
  );
});

test('year picker jumps years, pages, cancels, and preserves the selected task date', async () => {
  const onChange = jest.fn();
  render(<MonthCalendar day="2024-02-29" onChange={onChange} tasks={[]} />);
  fireEvent.press(screen.getByLabelText('Choose calendar year'));
  fireEvent(
    screen.UNSAFE_getAllByType(Modal).find(modal => modal.props.visible)!,
    'show',
  );
  expect(screen.getByRole('button', { name: 'Choose 2024' })).toBeSelected();
  fireEvent.press(screen.getByLabelText('Next 12 years'));
  expect(screen.getByLabelText('Choose 2028')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Previous 12 years'));
  fireEvent.press(screen.getByLabelText('Choose 2025'));
  await screen.findByText('February 2025');
  await waitFor(() =>
    expect(screen.queryByLabelText('Close year picker')).toBeNull(),
  );
  expect(screen.queryByLabelText('Close year picker')).toBeNull();
  expect(
    screen.queryByRole('button', { name: /February 29, 2025/ }),
  ).toBeNull();
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Choose calendar year'));
  fireEvent(
    screen.UNSAFE_getAllByType(Modal).find(modal => modal.props.visible)!,
    'show',
  );
  fireEvent.press(screen.getByLabelText('Next 12 years'));
  fireEvent.press(screen.getByLabelText('Close year picker'));
  expect(screen.getByText('February 2025')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Collapse calendar'));
  expect(screen.queryByLabelText('Choose calendar year')).toBeNull();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: /February 29, 2024/ }),
    ).toBeSelected(),
  );
});

test('note color saves without changing content, pinning, or list order', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  const note = {
    id: 'color-note',
    title: 'Paper thoughts',
    body: 'Keep this text',
    pinned: true,
    updatedAt: '2026-09-12T00:00:00Z',
  };
  await writePlanner('screen-test-user', 'note', [note]);
  render(<NotesHarness />);
  await screen.findByLabelText('Appearance for Paper thoughts');
  fireEvent.press(screen.getByLabelText('Appearance for Paper thoughts'));
  fireEvent(
    screen.UNSAFE_getAllByType(Modal).find(modal => modal.props.visible)!,
    'show',
  );
  fireEvent.press(screen.getByLabelText('Rose paper'));
  fireEvent.press(screen.getByLabelText('Save note appearance'));
  await waitFor(async () =>
    expect(await readPlanner('screen-test-user', 'note')).toEqual([
      { ...note, tone: 'rose' },
    ]),
  );
  await waitFor(() =>
    expect(screen.queryByLabelText('Save note appearance')).toBeNull(),
  );
  expect(await readPlanner('screen-test-user', 'note')).toEqual([
    { ...note, tone: 'rose' },
  ]);
});
