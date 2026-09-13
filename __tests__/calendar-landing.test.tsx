import React from 'react';
import {
  AccessibilityInfo,
  Animated,
  LayoutAnimation,
  StyleSheet,
} from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
  act,
} from '@testing-library/react-native';
import { DashboardScreen } from '../src/features/dashboard/Dashboard.screen';
import { MonthCalendar } from '../src/features/dashboard/components/MonthCalendar';
import { getToday } from '../src/hooks/useDate';
import { TaskCreationContext } from '../src/navigation/TaskCreationContext';
import { DashboardTabBar } from '../src/navigation/DashboardTabBar';
import { getAppTheme } from '../src/theme/colors';
import { createStyles as taskStyles } from '../src/components/task-quick-list/TaskQuickList.styles';
import type { Task } from '../src/types/task';

const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockRefresh = jest.fn().mockResolvedValue(undefined);
const mockApply = jest.fn();
let mockTasks: Task[] = [];
let mockHideCompleted = false;
let mockError: string | null = null;

jest.mock('../src/providers/TasksProvider', () => ({
  useTasks: () => ({
    tasks: { today: mockTasks, tomorrow: [], upcoming: [] },
    loading: false,
    refreshing: false,
    error: mockError,
    refresh: mockRefresh,
    applyTaskUpdate: mockApply,
  }),
}));
jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({
    themeMode: 'Light',
    hideCompleted: mockHideCompleted,
    advancedMode: false,
  }),
}));
jest.mock('../src/lib/taskRepository', () => ({
  useTaskRepository: () => ({
    create: jest.fn(),
    update: mockUpdate,
    remove: jest.fn(),
  }),
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
  DrawerActions: { openDrawer: jest.fn() },
  useNavigation: () => ({ dispatch: jest.fn() }),
}));
jest.mock('@react-navigation/drawer', () => ({
  useDrawerStatus: () => 'closed',
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 48, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('../src/features/dashboard/components/TaskComposerModal', () => {
  const { Text, Pressable } = require('react-native');
  return {
    TaskComposerModal: ({
      visible,
      selectedDate,
      onClose,
    }: {
      visible: boolean;
      selectedDate: string;
      onClose: () => void;
    }) =>
      visible ? (
        <Pressable accessibilityLabel="Close test composer" onPress={onClose}>
          <Text>Composer date: {selectedDate}</Text>
        </Pressable>
      ) : null,
  };
});

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 'landing-task',
  content: 'Take a little time outside',
  date: getToday(),
  target_group: 'today',
  priority: 0,
  isComplete: false,
  user_id: 'test-user',
  ...overrides,
});
const names = ['Calendar', 'Notes', 'Goals', 'Later'];
const tabProps = (index = 0) =>
  ({
    state: { index, routes: names.map(name => ({ key: name, name })) },
    descriptors: Object.fromEntries(names.map(name => [name, { options: {} }])),
    navigation: {
      navigate: jest.fn(),
      emit: jest.fn(() => ({ defaultPrevented: false })),
    },
  } as unknown as React.ComponentProps<typeof DashboardTabBar>);
function LandingHarness() {
  const [calendarDay, setCalendarDay] = React.useState(getToday());
  const [creationDate, setCreationDate] = React.useState<
    string | null | undefined
  >(undefined);
  const value = {
    calendarDay,
    setCalendarDay,
    openTask: (day?: string | null) =>
      setCreationDate(day === undefined ? getToday() : day),
  };
  return (
    <TaskCreationContext.Provider value={value}>
      <DashboardScreen
        route={{ params: { group: 'today', view: 'calendar' } }}
      />
      <DashboardTabBar {...tabProps()} />
      {creationDate !== undefined ? (
        <DashboardScreen
          composerOnly
          initialDate={creationDate}
          onComposerClose={() => setCreationDate(undefined)}
        />
      ) : null}
    </TaskCreationContext.Provider>
  );
}
const renderLanding = () => render(<LandingHarness />);

test('search uses compact glass and Calendar rows across dates, including completed tasks', async () => {
  mockHideCompleted = true;
  mockTasks = [
    task({ id: 'today', content: 'Read today' }),
    task({
      id: 'future',
      content: 'Read later',
      date: '2030-04-12',
      target_group: 'upcoming',
    }),
    task({ id: 'done', content: 'Read again', isComplete: true }),
  ];
  renderLanding();
  fireEvent.press(screen.getByLabelText('Search tasks'));
  expect(screen.getByLabelText('Search all tasks').props.editable).toBe(true);
  expect(screen.getByTestId('task-search-full-width')).toHaveStyle({
    width: '100%',
  });
  expect(screen.getByTestId('task-search-header')).toHaveStyle({
    flexDirection: 'column',
  });
  expect(
    within(screen.getByTestId('task-search-second-row')).getByLabelText(
      'Close search',
    ),
  ).toBeTruthy();
  expect(
    within(screen.getByTestId('task-search-second-row')).getByText('All tasks'),
  ).toBeTruthy();
  expect(screen.getByTestId('task-search-field')).toHaveStyle({
    flex: 1,
    borderRadius: 22,
  });
  expect(screen.getByTestId('task-search-expanding-field')).toHaveStyle({
    height: 44,
  });
  expect(screen.getByText('Find a task, from any day')).toBeTruthy();
  expect(screen.queryByLabelText('Clear search')).toBeNull();
  expect(screen.queryByLabelText('Collapse calendar')).toBeNull();
  fireEvent.changeText(screen.getByLabelText('Search all tasks'), 'read');
  expect(screen.getByLabelText('3 tasks found')).toBeTruthy();
  expect(screen.getAllByLabelText(/^Task:/)).toHaveLength(3);
  expect(screen.getByTestId('task-list')).toHaveStyle({ marginHorizontal: -8 });
  expect(screen.getByTestId('task-checkbox-done')).toHaveStyle({
    borderRadius: 5,
    backgroundColor: '#152D25',
  });
  expect(screen.getByLabelText('Add task')).toBeTruthy();
  await act(async () =>
    fireEvent.press(screen.getByLabelText('Mark as incomplete')),
  );
  expect(mockUpdate).toHaveBeenCalledWith(
    'done',
    expect.objectContaining({ isComplete: false }),
  );
  fireEvent.press(screen.getByLabelText('Task: Read later'));
  expect(screen.getByText('Composer date: 2030-04-12')).toBeTruthy();
});

test('global search task requests open the editor once and can reopen the same item later', async () => {
  mockTasks = [task()];
  const route = {
    params: {
      view: 'calendar' as const,
      openTaskRequest: { id: 'landing-task', requestId: 1 },
    },
  };
  const view = render(<DashboardScreen route={route} />);
  expect(screen.getByLabelText('Close test composer')).toBeOnTheScreen();
  fireEvent.press(screen.getByLabelText('Close test composer'));
  view.rerender(<DashboardScreen route={route} />);
  expect(screen.queryByLabelText('Close test composer')).toBeNull();
  view.rerender(
    <DashboardScreen
      route={{
        params: {
          ...route.params,
          openTaskRequest: { id: 'landing-task', requestId: 2 },
        },
      }}
    />,
  );
  expect(screen.getByLabelText('Close test composer')).toBeOnTheScreen();
  await act(async () => {});
});

test('clear, no results and cancel preserve Calendar selection and collapse state', async () => {
  renderLanding();
  const anotherDay = screen
    .getAllByRole('button')
    .find(
      button =>
        /^\w+, \w+ \d+, \d{4}/.test(button.props.accessibilityLabel ?? '') &&
        !button.props.accessibilityState?.selected,
    );
  fireEvent.press(anotherDay!);
  const selectedLabel = screen
    .getAllByRole('button')
    .find(button => button.props.accessibilityState?.selected)!.props
    .accessibilityLabel;
  fireEvent.press(screen.getByLabelText('Collapse calendar'));
  fireEvent.press(screen.getByLabelText('Search tasks'));
  fireEvent.changeText(
    screen.getByLabelText('Search all tasks'),
    'unmatched query',
  );
  expect(screen.getByText('No matching tasks')).toBeTruthy();
  expect(
    screen.queryByText('Adjust your filters to see tasks again.'),
  ).toBeNull();
  fireEvent.press(screen.getByLabelText('Clear search'));
  expect(screen.getByLabelText('Search all tasks').props.value).toBe('');
  expect(screen.queryByLabelText('Clear search')).toBeNull();
  fireEvent.changeText(screen.getByLabelText('Search all tasks'), '   ');
  expect(screen.getByText('Find a task, from any day')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Close search'));
  expect(
    screen.getByLabelText(selectedLabel).props.accessibilityState.selected,
  ).toBe(true);
  expect(screen.getByLabelText('Expand calendar')).toBeTruthy();
  expect(screen.getByLabelText('Go to today')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Search tasks'));
  expect(screen.getByLabelText('Search all tasks').props.value).toBe('');
  await act(async () => {
    await Promise.resolve();
  });
});

test.each([false, true])(
  'search motion respects Reduce Motion=%s',
  async reduceMotion => {
    jest.useFakeTimers();
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(reduceMotion);
    const layout = jest
      .spyOn(LayoutAnimation, 'configureNext')
      .mockImplementation(() => {});
    const timing = jest.spyOn(Animated, 'timing');
    renderLanding();
    await act(async () => {
      await Promise.resolve();
    });
    layout.mockClear();
    timing.mockClear();
    fireEvent.press(screen.getByLabelText('Search tasks'));
    expect(
      screen.getByTestId('search-underlay', { includeHiddenElements: true })
        .props.pointerEvents,
    ).toBe('none');
    expect(screen.getByLabelText('Search all tasks').props.editable).toBe(
      reduceMotion,
    );
    await act(async () => {
      jest.advanceTimersByTime(450);
    });
    expect(screen.getByLabelText('Search all tasks').props.editable).toBe(true);
    fireEvent.changeText(screen.getByLabelText('Search all tasks'), 'test');
    fireEvent.press(screen.getByLabelText('Clear search'));
    fireEvent.press(screen.getByLabelText('Close search'));
    if (!reduceMotion)
      expect(screen.getByTestId('task-search-overlay')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    expect(screen.queryByTestId('task-search-overlay')).toBeNull();
    expect(screen.getByTestId('search-underlay').props.pointerEvents).toBe(
      'auto',
    );
    if (reduceMotion) {
      expect(layout).not.toHaveBeenCalled();
      expect(timing).not.toHaveBeenCalled();
    } else {
      expect(layout).toHaveBeenCalledTimes(2);
      expect(timing).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ duration: 420, useNativeDriver: true }),
      );
      expect(timing).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ duration: 340, useNativeDriver: false }),
      );
    }
    jest.useRealTimers();
  },
);

test('search keeps retry available without a misleading empty state on error', async () => {
  mockError = 'Unable to load tasks';
  renderLanding();
  fireEvent.press(screen.getByLabelText('Search tasks'));
  expect(screen.queryByTestId('task-search-empty')).toBeNull();
  fireEvent.press(screen.getByLabelText('Retry loading tasks'));
  await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
});

test('compact header and calendar retain comfortable touch areas', async () => {
  renderLanding();
  expect(screen.getByTestId('calendar-selected-day')).toHaveStyle({
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 36,
  });
  expect(screen.getByTestId('calendar-selected-marker')).toHaveStyle({
    position: 'absolute',
    bottom: 3,
    alignSelf: 'center',
  });
  for (const label of ['Open navigation menu', 'Search tasks']) {
    expect(screen.getByLabelText(label)).toHaveStyle({ width: 44, height: 44 });
  }
  for (const id of ['calendar-menu-surface', 'calendar-search-surface']) {
    expect(screen.getByTestId(id)).toHaveStyle({ width: 36, height: 36 });
  }
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /, today/ })).toHaveStyle({
      minHeight: 44,
    }),
  );
});

test.each(['Light', 'Dark'] as const)(
  'compact task styles preserve square brand checkboxes in %s',
  mode => {
    const styles = taskStyles(getAppTheme(mode), true);
    expect(styles.checkbox).toMatchObject({
      width: 20,
      height: 20,
      borderRadius: 5,
    });
    expect(styles.checkboxDone.backgroundColor).toBe(
      mode === 'Dark' ? '#D8F3E5' : '#152D25',
    );
    expect(styles.checkboxTouchArea).toMatchObject({
      minWidth: 44,
      minHeight: 44,
    });
    expect(styles.contentArea.minHeight).toBe(44);
    expect(styles.row.paddingVertical).toBe(4);
    expect(styles.rowLabel).toMatchObject({ fontSize: 15, fontWeight: '400' });
  },
);

beforeEach(() => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  mockTasks = [];
  mockHideCompleted = false;
  mockError = null;
  jest.clearAllMocks();
});

afterEach(() => jest.restoreAllMocks());

test('empty landing keeps the plan action visible and opens the selected date', async () => {
  renderLanding();
  expect(screen.getByText('No tasks planned')).toBeTruthy();
  expect(screen.queryByLabelText('Go to today')).toBeNull();
  fireEvent.press(screen.getByLabelText('Next month'));
  // Browsing is not a selection change: the reset stays hidden.
  expect(screen.queryByLabelText('Go to today')).toBeNull();
  const expected = new Date(`${getToday()}T12:00:00`);
  expected.setDate(1);
  expected.setMonth(expected.getMonth() + 1);
  const expectedDay = `${expected.getFullYear()}-${String(
    expected.getMonth() + 1,
  ).padStart(2, '0')}-${String(expected.getDate()).padStart(2, '0')}`;
  fireEvent.press(
    screen.getByRole('button', {
      name: expected.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    }),
  );
  fireEvent.press(screen.getByLabelText('Add task'));
  expect(screen.getByText(`Composer date: ${expectedDay}`)).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Close test composer'));
  expect(screen.getByLabelText('Go to today')).toHaveStyle({
    width: 44,
    height: 44,
  });
  expect(screen.getByTestId('calendar-plan-heading')).toHaveStyle({
    marginRight: -7,
  });
  expect(
    within(screen.getByTestId('calendar-month')).queryByLabelText(
      'Go to today',
    ),
  ).toBeNull();
  expect(
    within(screen.getByTestId('calendar-plan-heading')).getByLabelText(
      'Go to today',
    ),
  ).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Go to today'));
  expect(screen.queryByLabelText('Go to today')).toBeNull();
  await waitFor(() =>
    expect(screen.getByRole('header', { name: 'Today' })).toBeTruthy(),
  );
  expect(
    screen.getByText(
      new Date(`${getToday()}T12:00:00`).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    ),
  ).toBeTruthy();
});

test.each([false, true])(
  'calendar tap, scroll, and reset transitions respect Reduce Motion=%s',
  async reduceMotion => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(reduceMotion);
    const layout = jest
      .spyOn(LayoutAnimation, 'configureNext')
      .mockImplementation(() => {});
    const timing = jest.spyOn(Animated, 'timing');
    renderLanding();
    await act(async () => {
      await Promise.resolve();
    });
    layout.mockClear();
    timing.mockClear();
    fireEvent.press(screen.getByLabelText('Collapse calendar'));
    expect(screen.getByTestId('calendar-week')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Expand calendar'));
    expect(screen.getByTestId('calendar-month')).toBeTruthy();
    const scroller = screen.getByTestId('dashboard-scroll');
    fireEvent(scroller, 'scrollBeginDrag', {
      nativeEvent: { contentOffset: { y: 0 } },
    });
    fireEvent.scroll(scroller, { nativeEvent: { contentOffset: { y: 30 } } });
    expect(screen.getByTestId('calendar-week')).toBeTruthy();
    const otherDay = screen
      .getAllByRole('button')
      .find(
        button =>
          button.props.accessibilityLabel?.match(/\d{4}/) &&
          !button.props.accessibilityState?.selected,
      );
    fireEvent.press(otherDay!);
    fireEvent.press(screen.getByLabelText('Go to today'));
    expect(screen.getByRole('header', { name: 'Today' })).toBeTruthy();
    expect(screen.getByTestId('calendar-week')).toBeTruthy();
    if (reduceMotion) {
      expect(layout).not.toHaveBeenCalled();
      expect(timing).not.toHaveBeenCalled();
      expect(screen.getByTestId('calendar-week')).toHaveStyle({ opacity: 1 });
    } else {
      expect(layout).toHaveBeenCalledTimes(4);
      expect(layout).toHaveBeenLastCalledWith(
        expect.objectContaining({
          duration: 320,
          update: { type: 'easeInEaseOut' },
        }),
      );
      expect(timing).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          duration: 320,
          toValue: 1,
          useNativeDriver: true,
          isInteraction: false,
        }),
      );
    }
  },
);

test('global creation preserves the selected past date', async () => {
  renderLanding();
  fireEvent.press(screen.getByLabelText('Previous month'));
  const previous = new Date(`${getToday()}T12:00:00`);
  previous.setDate(1);
  previous.setMonth(previous.getMonth() - 1);
  fireEvent.press(
    screen.getByRole('button', {
      name: previous.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    }),
  );
  fireEvent.press(screen.getByLabelText('Add task'));
  expect(
    screen.getByText(
      `Composer date: ${previous.getFullYear()}-${String(
        previous.getMonth() + 1,
      ).padStart(2, '0')}-01`,
    ),
  ).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Close test composer'));
  expect(screen.queryByLabelText('Plan your first task')).toBeNull();
  expect(screen.getByText('No tasks planned')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Go to today'));
  await waitFor(() => expect(screen.getByLabelText('Add task')).toBeTruthy());
});

test('populated landing preserves completion and editing interactions', async () => {
  mockTasks = [task()];
  renderLanding();
  expect(screen.getByText('0/1')).toBeTruthy();
  expect(screen.getByTestId('task-list')).toHaveStyle({ marginHorizontal: -8 });
  const listStyle = StyleSheet.flatten(
    screen.getByTestId('task-list').props.style,
  );
  expect(listStyle.backgroundColor).toBeUndefined();
  expect(listStyle.borderWidth).toBeUndefined();
  expect(screen.getByTestId('task-checkbox-landing-task')).toHaveStyle({
    width: 20,
    height: 20,
    borderRadius: 5,
  });
  fireEvent.press(screen.getByLabelText('Mark as complete'));
  await waitFor(() =>
    expect(mockUpdate).toHaveBeenCalledWith('landing-task', {
      isComplete: true,
      completed_at: getToday(),
    }),
  );
  fireEvent.press(screen.getByLabelText('Task: Take a little time outside'));
  expect(screen.getByText(`Composer date: ${getToday()}`)).toBeTruthy();
});

test('retired hide-completed preference never hides calendar tasks', async () => {
  mockTasks = [task({ isComplete: true })];
  mockHideCompleted = true;
  renderLanding();
  expect(
    screen.getByLabelText('Task: Take a little time outside'),
  ).toBeTruthy();
  expect(screen.queryByLabelText('Plan your first task')).toBeNull();
  await waitFor(() => expect(screen.getByText('1/1')).toBeTruthy());
});

test('calendar comes first with a compact grabber strip and retained tap area in both views', async () => {
  mockTasks = [
    task({ id: 'first', isComplete: true }),
    task({ id: 'second' }),
    task({ id: 'third' }),
  ];
  renderLanding();
  const summary = within(screen.getByTestId('calendar-plan-summary'));
  expect(summary.getByRole('header', { name: 'Today' })).toBeTruthy();
  expect(summary.getByText('1/3')).toBeTruthy();
  expect(summary.getByLabelText('1 of 3 tasks completed')).toBeTruthy();
  expect(screen.getByTestId('calendar-plan-summary')).toHaveStyle({
    flexDirection: 'row',
    gap: 8,
  });
  expect(screen.queryByTestId('calendar-controls')).toBeNull();
  expect(screen.queryByTestId('calendar-view-switch')).toBeNull();
  const firstMonthChild = screen.getByTestId('calendar-block').children[0];
  expect(
    typeof firstMonthChild === 'object' ? firstMonthChild.props.testID : null,
  ).toBe('calendar-month');
  const heading = within(screen.getByTestId('calendar-plan-heading'));
  expect(heading.queryByLabelText('Collapse calendar')).toBeNull();
  const collapse = within(screen.getByTestId('calendar-block')).getByLabelText(
    'Collapse calendar',
  );
  expect(collapse).toHaveStyle({ minWidth: 72, minHeight: 44 });
  expect(within(collapse).getByTestId('calendar-grabber')).toHaveStyle({
    width: 28,
    height: 3,
    borderRadius: 1.5,
  });
  expect(collapse.props.accessibilityState).toEqual({ expanded: true });
  expect(screen.queryByTestId('calendar-bottom-controls')).toBeNull();
  expect(screen.getByTestId('calendar-grabber-space')).toHaveStyle({
    height: 20,
  });
  expect(screen.getByTestId('calendar-block')).toHaveStyle({
    paddingBottom: 24,
    marginBottom: -14,
  });
  expect(collapse).toHaveStyle({
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  });
  fireEvent.press(collapse);
  await waitFor(() => expect(screen.getByTestId('calendar-week')).toBeTruthy());
  expect(screen.getByTestId('calendar-grabber-space')).toHaveStyle({
    height: 20,
  });
  expect(screen.getByTestId('calendar-block')).toHaveStyle({
    paddingBottom: 24,
  });
  expect(screen.queryByTestId('calendar-footer')).toBeNull();
  const firstWeekChild = screen.getByTestId('calendar-block').children[0];
  expect(
    typeof firstWeekChild === 'object' ? firstWeekChild.props.testID : null,
  ).toBe('calendar-week');
  expect(summary.getByText('1/3')).toBeTruthy();
  expect(heading.queryByLabelText('Expand calendar')).toBeNull();
  const expand = within(screen.getByTestId('calendar-block')).getByLabelText(
    'Expand calendar',
  );
  expect(expand.props.accessibilityState).toEqual({ expanded: false });
  expect(within(expand).getByTestId('calendar-grabber')).toHaveStyle({
    width: 28,
    height: 3,
  });
  fireEvent.press(expand);
  expect(screen.getByTestId('calendar-month')).toBeTruthy();
  expect(screen.getByTestId('calendar-grabber-space')).toHaveStyle({
    height: 20,
  });
  expect(screen.queryByTestId('calendar-expand-row')).toBeNull();
});

test('week view can reset a different selected date without reopening the month', async () => {
  renderLanding();
  fireEvent.press(screen.getByLabelText('Collapse calendar'));
  const otherDay = screen
    .getAllByRole('button')
    .find(
      button =>
        button.props.accessibilityLabel?.match(/\d{4}/) &&
        !button.props.accessibilityState?.selected,
    );
  expect(otherDay).toBeTruthy();
  fireEvent.press(otherDay!);
  expect(screen.queryByRole('header', { name: 'Today' })).toBeNull();
  const reset = within(
    screen.getByTestId('calendar-plan-heading'),
  ).getByLabelText('Go to today');
  expect(
    within(screen.getByTestId('calendar-block')).queryByLabelText(
      'Go to today',
    ),
  ).toBeNull();
  fireEvent.press(reset);
  await waitFor(() =>
    expect(screen.getByRole('header', { name: 'Today' })).toBeTruthy(),
  );
  expect(screen.queryByLabelText('Go to today')).toBeNull();
  expect(screen.getByTestId('calendar-week')).toBeTruthy();
  expect(
    screen.getByLabelText('Expand calendar').props.accessibilityState,
  ).toEqual({ expanded: false });
});

test('loading failure keeps a working retry action', async () => {
  mockError = 'Unable to load tasks.';
  renderLanding();
  fireEvent.press(screen.getByLabelText('Retry loading tasks'));
  await waitFor(() =>
    expect(mockRefresh).toHaveBeenCalledWith({ showRefreshSpinner: true }),
  );
  expect(screen.queryByText('No tasks planned')).toBeNull();
});

test('calendar crosses a year boundary and collapse returns to the selected week', async () => {
  const onChange = jest.fn();
  render(<MonthCalendar day="2026-12-30" onChange={onChange} tasks={[]} />);
  fireEvent.press(screen.getByLabelText('Next month'));
  expect(screen.getByText('January 2027')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: /January 6, 2027/ }));
  expect(onChange).toHaveBeenCalledWith('2027-01-06');
  fireEvent.press(screen.getByLabelText('Next month'));
  expect(screen.getByText('February 2027')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Collapse calendar'));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: /December 30, 2026/ }),
    ).toBeSelected(),
  );
});

test('upward scrolling collapses the default month only during a user drag', async () => {
  renderLanding();
  expect(screen.getByTestId('calendar-month')).toBeTruthy();
  const scroller = screen.getByTestId('dashboard-scroll');
  fireEvent.scroll(scroller, { nativeEvent: { contentOffset: { y: 40 } } });
  expect(screen.getByTestId('calendar-month')).toBeTruthy();
  fireEvent(scroller, 'scrollBeginDrag', {
    nativeEvent: { contentOffset: { y: 0 } },
  });
  fireEvent.scroll(scroller, { nativeEvent: { contentOffset: { y: 30 } } });
  await waitFor(() => expect(screen.getByTestId('calendar-week')).toBeTruthy());
  fireEvent.press(screen.getByLabelText('Expand calendar'));
  expect(screen.getByTestId('calendar-month')).toBeTruthy();
});
test.each(names)(
  'floating plus opens creation without navigating away from %s',
  async name => {
    const openTask = jest.fn();
    const openNote = jest.fn();
    const openGoal = jest.fn();
    const addLabel =
      name === 'Notes'
        ? 'Add note'
        : name === 'Goals'
        ? 'Add goal'
        : 'Add task';
    const props = tabProps(names.indexOf(name));
    render(
      <TaskCreationContext.Provider
        value={{
          openTask,
          noteAction: { onPress: openNote, disabled: false },
          goalAction: { onPress: openGoal, disabled: false, label: 'Add goal' },
          calendarDay: '2027-01-05',
          setCalendarDay: jest.fn(),
        }}
      >
        <DashboardTabBar {...props} />
      </TaskCreationContext.Provider>,
    );
    expect(screen.getByLabelText(addLabel)).toHaveStyle({
      width: 46,
      height: 46,
    });
    expect(screen.getByTestId('global-add-surface')).toHaveStyle({
      width: 46,
      height: 46,
      borderWidth: 0,
    });
    expect(screen.getByTestId('global-add-tint')).toHaveStyle({
      backgroundColor: '#152D25',
    });
    expect(screen.getByTestId('tab-dock-edge').props.pointerEvents).toBe(
      'none',
    );
    fireEvent.press(screen.getByLabelText(addLabel));
    if (name === 'Notes') {
      expect(openNote).toHaveBeenCalledTimes(1);
      expect(openTask).not.toHaveBeenCalled();
    } else if (name === 'Goals') {
      expect(openGoal).toHaveBeenCalledTimes(1);
      expect(openTask).not.toHaveBeenCalled();
    } else {
      expect(openTask).toHaveBeenCalledWith(
        name === 'Calendar'
          ? '2027-01-05'
          : name === 'Later'
          ? null
          : undefined,
      );
      expect(openNote).not.toHaveBeenCalled();
    }
    await waitFor(() =>
      expect(props.navigation.navigate).not.toHaveBeenCalled(),
    );
  },
);

test('an upward swipe also collapses a month when an empty page has little scroll range', async () => {
  renderLanding();
  const scroller = screen.getByTestId('dashboard-scroll');
  fireEvent(scroller, 'touchStart', {
    nativeEvent: { pageX: 150, pageY: 500 },
  });
  fireEvent(scroller, 'touchMove', { nativeEvent: { pageX: 220, pageY: 490 } });
  expect(screen.getByTestId('calendar-month')).toBeTruthy();
  fireEvent(scroller, 'touchMove', { nativeEvent: { pageX: 154, pageY: 450 } });
  await waitFor(() => expect(screen.getByTestId('calendar-week')).toBeTruthy());
});
